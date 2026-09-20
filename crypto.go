package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"io"

	"golang.org/x/crypto/pbkdf2"
)

const (
	CryptoMagic      = "AHEN1"
	FlagPassword     = 0x01
	DefaultChunkSize = 1 << 20
	MinChunkSize     = 64 << 10
	MaxChunkSize     = 16 << 20
	MaxChunks        = 1 << 20
	PBKDF2Iter       = 100_000
	gcmTagSize       = 16
	headerSize       = 5 + 1 + 16 + 12 + 4
)

var (
	ErrTooShort      = fmt.Errorf("data too short")
	ErrBadMagic      = fmt.Errorf("not a v2 envelope")
	ErrBadHeader     = fmt.Errorf("invalid v2 header")
	ErrAuthFailed    = fmt.Errorf("authentication failed: wrong key or corrupted data")
	ErrTruncated     = fmt.Errorf("truncated data")
	ErrFrameTooLarge = fmt.Errorf("frame too large")
	ErrTooManyChunks = fmt.Errorf("too many chunks")
)

type Header struct {
	PasswordMode bool
	Salt         [16]byte
	BaseNonce    [12]byte
	ChunkSize    uint32
}

func StoredSize(plainSize int64, chunkSize uint32) int64 {
	if plainSize == 0 {
		return int64(headerSize)
	}
	chunks := (plainSize + int64(chunkSize) - 1) / int64(chunkSize)
	return int64(headerSize) + plainSize + chunks*(4+gcmTagSize)
}

func StoredSizeDefault(plainSize int64) int64 {
	return StoredSize(plainSize, DefaultChunkSize)
}

func DeriveLegacyKey(password string) []byte {
	sum := sha256.Sum256([]byte(password))
	return sum[:]
}

func DeriveKey(password string, salt []byte) []byte {
	return pbkdf2.Key([]byte(password), salt, PBKDF2Iter, 32, sha256.New)
}

func IsRawKeyFragment(frag string) bool {
	if len(frag) != 43 {
		return false
	}
	for i := 0; i < len(frag); i++ {
		c := frag[i]
		if !(c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z' ||
			c >= '0' && c <= '9' || c == '-' || c == '_') {
			return false
		}
	}
	return true
}

func IsV2(prefix []byte) bool {
	return len(prefix) >= len(CryptoMagic) && string(prefix[:len(CryptoMagic)]) == CryptoMagic
}

func newGCM(key []byte) (cipher.AEAD, error) {
	if len(key) != 32 {
		return nil, fmt.Errorf("key must be 32 bytes, got %d", len(key))
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

func chunkNonce(base [12]byte, counter uint64) []byte {
	n := make([]byte, 12)
	copy(n, base[:])
	ctr := binary.BigEndian.Uint64(n[4:])
	binary.BigEndian.PutUint64(n[4:], ctr^counter)
	return n
}

func EncryptStream(key []byte, passwordMode bool, r io.Reader, w io.Writer, chunkSize int, randReader io.Reader) (Header, error) {
	var hdr Header
	if chunkSize < MinChunkSize || chunkSize > MaxChunkSize {
		return hdr, fmt.Errorf("chunk size %d out of range", chunkSize)
	}
	if randReader == nil {
		randReader = rand.Reader
	}
	if _, err := io.ReadFull(randReader, hdr.Salt[:]); err != nil {
		return hdr, fmt.Errorf("salt: %w", err)
	}
	if _, err := io.ReadFull(randReader, hdr.BaseNonce[:]); err != nil {
		return hdr, fmt.Errorf("nonce: %w", err)
	}
	hdr.PasswordMode = passwordMode
	hdr.ChunkSize = uint32(chunkSize)
	if err := EncryptStreamWithHeader(key, hdr, r, w); err != nil {
		return hdr, err
	}
	return hdr, nil
}

func EncryptPasswordStream(password string, r io.Reader, w io.Writer, chunkSize int) (Header, error) {
	var hdr Header
	if chunkSize < MinChunkSize || chunkSize > MaxChunkSize {
		return hdr, fmt.Errorf("chunk size %d out of range", chunkSize)
	}
	if _, err := io.ReadFull(rand.Reader, hdr.Salt[:]); err != nil {
		return hdr, fmt.Errorf("salt: %w", err)
	}
	if _, err := io.ReadFull(rand.Reader, hdr.BaseNonce[:]); err != nil {
		return hdr, fmt.Errorf("nonce: %w", err)
	}
	hdr.PasswordMode = true
	hdr.ChunkSize = uint32(chunkSize)
	if err := EncryptStreamWithHeader(DeriveKey(password, hdr.Salt[:]), hdr, r, w); err != nil {
		return hdr, err
	}
	return hdr, nil
}

func EncryptStreamWithHeader(key []byte, hdr Header, r io.Reader, w io.Writer) error {
	if hdr.ChunkSize < MinChunkSize || hdr.ChunkSize > MaxChunkSize {
		return fmt.Errorf("chunk size %d out of range", hdr.ChunkSize)
	}
	gcm, err := newGCM(key)
	if err != nil {
		return err
	}
	var flags byte
	if hdr.PasswordMode {
		flags = FlagPassword
	}
	head := make([]byte, 0, headerSize)
	head = append(head, CryptoMagic...)
	head = append(head, flags)
	head = append(head, hdr.Salt[:]...)
	head = append(head, hdr.BaseNonce[:]...)
	var tmp [4]byte
	binary.BigEndian.PutUint32(tmp[:], hdr.ChunkSize)
	head = append(head, tmp[:]...)
	if _, err := w.Write(head); err != nil {
		return err
	}

	buf := make([]byte, hdr.ChunkSize)
	var counter uint64
	for {
		n, rerr := io.ReadFull(r, buf)
		if rerr != nil && rerr != io.EOF && rerr != io.ErrUnexpectedEOF {
			return rerr
		}
		if n > 0 {
			if counter >= MaxChunks {
				return ErrTooManyChunks
			}
			ct := gcm.Seal(nil, chunkNonce(hdr.BaseNonce, counter), buf[:n], nil)
			binary.BigEndian.PutUint32(tmp[:], uint32(len(ct)))
			if _, err := w.Write(tmp[:]); err != nil {
				return err
			}
			if _, err := w.Write(ct); err != nil {
				return err
			}
			counter++
		}
		if rerr == io.EOF || rerr == io.ErrUnexpectedEOF {
			break
		}
	}
	return nil
}

func ParseHeader(data []byte) (Header, error) {
	var hdr Header
	if len(data) < headerSize {
		return hdr, fmt.Errorf("%w: need %d header bytes, have %d", ErrTooShort, headerSize, len(data))
	}
	if string(data[:5]) != CryptoMagic {
		return hdr, ErrBadMagic
	}
	flags := data[5]
	if flags&^FlagPassword != 0 {
		return hdr, fmt.Errorf("%w: unknown flags 0x%02x", ErrBadHeader, flags)
	}
	hdr.PasswordMode = flags&FlagPassword != 0
	copy(hdr.Salt[:], data[6:22])
	copy(hdr.BaseNonce[:], data[22:34])
	hdr.ChunkSize = binary.BigEndian.Uint32(data[34:38])
	if hdr.ChunkSize < MinChunkSize || hdr.ChunkSize > MaxChunkSize {
		return hdr, fmt.Errorf("%w: chunk size %d", ErrBadHeader, hdr.ChunkSize)
	}
	return hdr, nil
}

func DecryptStream(key []byte, r io.Reader, w io.Writer, maxTotal int64, onChunk func(done, total int)) error {
	gcm, err := newGCM(key)
	if err != nil {
		return err
	}
	if maxTotal <= 0 {
		maxTotal = DefaultMaxDecryptTotal
	}
	head := make([]byte, headerSize)
	if _, err := io.ReadFull(r, head); err != nil {
		return fmt.Errorf("%w: reading header: %v", ErrTruncated, err)
	}
	hdr, err := ParseHeader(head)
	if err != nil {
		return err
	}
	frameCap := int64(hdr.ChunkSize) + gcmTagSize
	ct := make([]byte, frameCap)
	var tmp [4]byte
	var counter uint64
	var total int64
	for {
		_, rerr := io.ReadFull(r, tmp[:])
		if rerr == io.EOF {
			break
		}
		if rerr == io.ErrUnexpectedEOF {
			return fmt.Errorf("%w: frame length", ErrTruncated)
		}
		if rerr != nil {
			return rerr
		}
		flen := binary.BigEndian.Uint32(tmp[:])
		if flen < gcmTagSize+1 || int64(flen) > frameCap {
			return fmt.Errorf("%w: %d (chunk size %d)", ErrFrameTooLarge, flen, hdr.ChunkSize)
		}
		if counter >= MaxChunks {
			return ErrTooManyChunks
		}
		if _, err := io.ReadFull(r, ct[:flen]); err != nil {
			return fmt.Errorf("%w: frame %d body", ErrTruncated, counter)
		}
		pt, err := gcm.Open(nil, chunkNonce(hdr.BaseNonce, counter), ct[:flen], nil)
		if err != nil {
			return fmt.Errorf("%w: chunk %d", ErrAuthFailed, counter)
		}
		total += int64(len(pt))
		if total > maxTotal {
			return fmt.Errorf("plaintext exceeds %d bytes", maxTotal)
		}
		if _, err := w.Write(pt); err != nil {
			return err
		}
		counter++
		if onChunk != nil {
			onChunk(int(counter), -1)
		}
	}
	return nil
}

const DefaultMaxDecryptTotal = 2 << 30

func EncryptLegacy(key, plaintext []byte) ([]byte, error) {
	gcm, err := newGCM(key)
	if err != nil {
		return nil, err
	}
	iv := make([]byte, 12)
	if _, err := rand.Read(iv); err != nil {
		return nil, err
	}
	ct := gcm.Seal(nil, iv, plaintext, nil)
	out := make([]byte, 12+len(ct))
	copy(out, iv)
	copy(out[12:], ct)
	return out, nil
}

func DecryptLegacy(key, data []byte) ([]byte, error) {
	gcm, err := newGCM(key)
	if err != nil {
		return nil, err
	}
	if len(data) < 12+gcmTagSize+1 {
		return nil, ErrTooShort
	}
	pt, err := gcm.Open(nil, data[:12], data[12:], nil)
	if err != nil {
		return nil, ErrAuthFailed
	}
	return pt, nil
}

func ResolveV1Key(fragment string, b64decode func(string) ([]byte, error)) ([]byte, error) {
	if IsRawKeyFragment(fragment) {
		key, err := b64decode(fragment)
		if err != nil {
			return nil, fmt.Errorf("bad key encoding: %w", err)
		}
		if len(key) != 32 {
			return nil, fmt.Errorf("key must decode to 32 bytes, got %d", len(key))
		}
		return key, nil
	}
	if fragment == "" {
		return nil, fmt.Errorf("missing decryption key")
	}
	return DeriveLegacyKey(fragment), nil
}

func SniffedDecrypt(fragment string, b64decode func(string) ([]byte, error), data []byte, maxTotal int64) ([]byte, error) {
	if IsV2(data) {
		if len(data) < headerSize {
			return nil, ErrTooShort
		}
		hdr, err := ParseHeader(data[:headerSize])
		if err != nil {
			return nil, err
		}
		if IsRawKeyFragment(fragment) {
			if key, err := b64decode(fragment); err == nil && len(key) == 32 {
				var out bytes.Buffer
				derr := DecryptStream(key, bytes.NewReader(data), &out, maxTotal, nil)
				if derr == nil {
					return out.Bytes(), nil
				}
				if !isAuthError(derr) {
					return nil, derr
				}
			}
		}
		if fragment == "" {
			return nil, fmt.Errorf("missing decryption key")
		}
		var out bytes.Buffer
		if err := DecryptStream(DeriveKey(fragment, hdr.Salt[:]), bytes.NewReader(data), &out, maxTotal, nil); err != nil {
			return nil, err
		}
		return out.Bytes(), nil
	}
	key, err := ResolveV1Key(fragment, b64decode)
	if err != nil {
		return nil, err
	}
	return DecryptLegacy(key, data)
}

func isAuthError(err error) bool {
	return err != nil && bytes.Contains([]byte(err.Error()), []byte(ErrAuthFailed.Error()))
}
