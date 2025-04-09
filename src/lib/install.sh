#!/bin/bash

set -e

API_URL="${API_URL:-https://anon.love}"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/anonhost"
CONFIG_FILE="$CONFIG_DIR/config"
CACHE_DIR="$CONFIG_DIR/cache"
VERSION="1.0.1"

if command -v tput >/dev/null 2>&1 && tty -s; then
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    BLUE=$(tput setaf 4)
    YELLOW=$(tput setaf 3)
    BOLD=$(tput bold)
    NC=$(tput sgr0)
else
    RED=""
    GREEN=""
    BLUE=""
    YELLOW=""
    BOLD=""
    NC=""
fi

spinner() {
  if ! tty -s; then return; fi
  local pid=$1
  local delay=0.1
  local spinstr='|/-\\'
  while ps -p "$pid" >/dev/null; do
    printf " [%c]  " "$spinstr"
    spinstr="${spinstr:1}${spinstr:0:1}"
    sleep "$delay"
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

print_status() {
  printf "%s%s%s %s\n" "${BOLD}" "${2:-$BLUE}" "${NC}" "$1"
}

print_error() {
  printf "%sError:%s %s\n" "${RED}" "${NC}" "$1" >&2
}

print_success() {
  printf "%sSuccess:%s %s\n" "${GREEN}" "${NC}" "$1"
}

check_dependencies() {
  local deps=("curl" "jq" "file")
  local clipboard_tool_found=false
  local missing=()

  if command -v "wl-copy" >/dev/null 2>&1 && command -v "wl-paste" >/dev/null 2>&1; then
      clipboard_tool_found=true
  elif command -v "xclip" >/dev/null 2>&1; then
      clipboard_tool_found=true
  fi

  if ! $clipboard_tool_found; then
      missing+=("wl-clipboard (for wl-copy/wl-paste) or xclip")
  fi

  for dep in "${deps[@]}"; do
    if ! command -v "$dep" >/dev/null 2>&1; then
      missing+=("$dep")
    fi
  done

  if ((${#missing[@]} > 0)); then
    print_error "Missing dependencies: ${missing[*]}"
    echo "Please install the missing packages using your system's package manager."
    echo "Example (Debian/Ubuntu): sudo apt install curl jq file wl-clipboard xclip"
    exit 1
  fi
}

setup_config() {
  mkdir -p "$CONFIG_DIR" "$CACHE_DIR"

  if [[ ! -f "$CONFIG_FILE" && -n "$ANONHOST_API_KEY" ]]; then
    printf "%s\n" "$ANONHOST_API_KEY" >"$CONFIG_FILE"
    chmod 600 "$CONFIG_FILE"
    print_status "API key from ANONHOST_API_KEY saved to config." "${GREEN}"
  fi
}

get_api_key() {
  if [[ -f "$CONFIG_FILE" ]]; then
    cat "$CONFIG_FILE"
  else
    echo ""
  fi
}

format_size() {
  local size=$1
  if ! [[ "$size" =~ ^[0-9]+$ ]]; then
      printf "N/A"
      return
  fi

  if ((size >= 1073741824)); then
    printf "%dGB" "$((size / 1073741824))"
  elif ((size >= 1048576)); then
    printf "%dMB" "$((size / 1048576))"
  elif ((size >= 1024)); then
    printf "%dKB" "$((size / 1024))"
  else
    printf "%dB" "$size"
  fi
}

call_api() {
    local method="$1"
    local path="$2"
    local api_key="$3"
    local curl_opts=()
    local data_opts=()

    curl_opts+=(-H "Authorization: Bearer $api_key")

    case "$method" in
        GET)
            curl_opts+=(-X GET)
            ;;
        POST)
            curl_opts+=(-X POST)
            shift 3
            data_opts=("$@")
            ;;
        DELETE)
            curl_opts+=(-X DELETE)
            ;;
        *)
            print_error "Unsupported HTTP method: $method"
            return 1
            ;;
    esac

    curl_opts+=(-H "Accept: application/json")

    local response
    local http_code
    local body

    response=$(curl -s -w "\n%{http_code}" "${curl_opts[@]}" "${data_opts[@]}" "$API_URL$path")
    http_code=$(tail -n1 <<< "$response")
    body=$(sed '$ d' <<< "$response")

    if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
        print_error "API request failed ($path) with HTTP status code: $http_code"
        if [[ -n "$body" ]]; then
            if jq -e '.error' <<<"$body" >/dev/null 2>&1; then
                 print_error "API Error: $(jq -r '.error' <<<"$body")"
            elif jq -e '.message' <<<"$body" >/dev/null 2>&1; then
                 print_error "API Error: $(jq -r '.message' <<<"$body")"
            else
                echo "API Response Body:" >&2
                echo "$body" >&2
            fi
        fi
        return 1
    fi

    if [[ -n "$body" ]] && ! jq -e . >/dev/null 2>&1 <<<"$body"; then
        print_error "Received invalid JSON response from API ($path)."
        echo "API Response Body:" >&2
        echo "$body" >&2
        return 1
    fi

    printf "%s" "$body"
    return 0
}


get_stats() {
  local api_key="$1"
  local body

  body=$(call_api "GET" "/api/stats" "$api_key") || return 1

  local total_uploads=$(jq -r '.totalUploads // "N/A"' <<<"$body")
  local storage_used=$(jq -r '.storageUsed // 0' <<<"$body")
  local storage_limit=$(jq -r '.storageLimit // 0' <<<"$body")
  local is_premium=$(jq -r '.isPremium // "N/A"' <<<"$body")
  local is_admin=$(jq -r '.isAdmin // "N/A"' <<<"$body")

  local formatted_storage_used=$(format_size "$storage_used")
  local formatted_storage_limit=$(format_size "$storage_limit")

  printf "Total Uploads: %s\n" "$total_uploads"
  printf "Storage Used: %s\n" "$formatted_storage_used"
  printf "Storage Limit: %s\n" "$formatted_storage_limit"
  printf "Is Premium: %s\n" "$is_premium"
  printf "Is Admin: %s\n" "$is_admin"
}

copy_to_clipboard() {
  local text="$1"
  if command -v "wl-copy" >/dev/null 2>&1; then
    printf "%s" "$text" | wl-copy
  elif command -v "xclip" >/dev/null 2>&1; then
    printf "%s" "$text" | xclip -selection clipboard
  else
    print_error "Neither wl-copy nor xclip found. Cannot copy to clipboard."
    return 1
  fi
  return 0
}

read_from_clipboard() {
  if command -v "wl-paste" >/dev/null 2>&1; then
    wl-paste --no-newline 2>/dev/null || echo ""
  elif command -v "xclip" >/dev/null 2>&1; then
    xclip -selection clipboard -o 2>/dev/null || echo ""
  else
    echo ""
  fi
}

upload_file() {
  local file="$1"
  local public="${2:-false}"
  local api_key="$3"
  local custom_domain="${4:-}"
  local body

  validate_file "$file" || return 1

  print_status "Uploading $(basename "$file")" "${BLUE}"

  local data_opts=(-F "file=@$file" -F "public=$public")
  [[ -n "$custom_domain" ]] && data_opts+=(-F "domain=$custom_domain")

  body=$(call_api "POST" "/api/media" "$api_key" "${data_opts[@]}") || return 1

  local url=$(jq -r '.url // "N/A"' <<<"$body")
  local id=$(jq -r '.id // "N/A"' <<<"$body")
  local type=$(jq -r '.type // "N/A"' <<<"$body")
  local size=$(jq -r '.size // 0' <<<"$body")
  local formatted_size=$(format_size "$size")
  local is_public=$(jq -r '.public // "N/A"' <<<"$body")
  local domain=$(jq -r '.domain // "default"' <<<"$body")
  local created_at_raw=$(jq -r '.createdAt // ""' <<<"$body")
  local created_at=""
  if [[ -n "$created_at_raw" ]]; then
      created_at=$(echo "$created_at_raw" | sed 's/\.[0-9]*Z$//; s/Z$//; s/T/ /')
  else
      created_at="N/A"
  fi

  if copy_to_clipboard "$url"; then
      print_success "File uploaded and URL copied to clipboard"
  else
      print_error "File uploaded but failed to copy URL to clipboard."
      print_status "URL: $url"
  fi

  printf "ID: %s\n" "$id"
  printf "URL: %s\n" "$url"
  printf "Type: %s\n" "$type"
  printf "Size: %s\n" "$formatted_size"
  printf "Public: %s\n" "$is_public"
  printf "Domain: %s\n" "$domain"
  printf "Created At: %s\n" "$created_at"
}

list_files() {
  local page="${1:-1}"
  local limit="${2:-20}"
  local api_key="$3"
  local sort="${4:-createdAt}"
  local order="${5:-desc}"
  local body

  print_status "Fetching media list (Page: $page, Limit: $limit)..." "${BLUE}"

  local query_params="?page=$page&limit=$limit&sort=$sort&order=$order"
  body=$(call_api "GET" "/api/media$query_params" "$api_key") || return 1

  printf "%-10s %-30s %-15s %-10s %-20s %s\n" "ID" "Filename" "Type" "Size" "Created At" "URL"
  printf "%s\n" "------------------------------------------------------------------------------------------------------------------------"

  local media_json=$(jq -c '.media // []' <<< "$body")

   if [[ "$(jq 'length' <<< "$media_json")" -eq 0 ]]; then
        printf "No media found.\n"
   else
        jq -r '.[] | [
            .id // "N/A",
            .filename // "N/A",
            .type // "N/A",
            .size // 0,
            (.createdAt // "") | sub("\\.[0-9]*Z$"; "Z") | sub("Z$"; "") | sub("T"; " ") | if . == "" then "N/A" else . end,
            .url // "N/A"
        ] | @tsv' <<< "$media_json" | while IFS=$'\t' read -r id filename type size created_at url; do
            local formatted_size=$(format_size "$size")

            if ((${#filename} > 28)); then filename="${filename:0:25}..."; fi
            if ((${#url} > 40)); then url="${url:0:37}..."; fi

            printf "%-10s %-30s %-15s %-10s %-20s %s\n" "$id" "$filename" "$type" "$formatted_size" "$created_at" "$url"
        done
   fi


  printf "\n%sStats:%s\n" "${BOLD}" "${NC}"
  jq -r '.stats | to_entries[]? | "\(.key): \(.value // "N/A")"' <<<"$body"
}


watch_clipboard() {
  local api_key="$1"
  print_status \
    "Watching clipboard for media files... (Ctrl+C to stop)" "${BLUE}"

  local last_clipboard_content=""
  while true; do
    local current_clipboard_content=$(read_from_clipboard)

    if [[ "$current_clipboard_content" != "$last_clipboard_content" && -f "$current_clipboard_content" ]]; then
        local mime_type=$(file --mime-type -b "$current_clipboard_content" 2>/dev/null || echo "")
        if [[ "$mime_type" =~ ^(image|video)/ ]]; then
            print_status "Detected media file in clipboard: $current_clipboard_content" "${YELLOW}"
            upload_file "$current_clipboard_content" "false" "$api_key"
            last_clipboard_content="$current_clipboard_content"
        fi
    fi
    if [[ "$current_clipboard_content" != "$last_clipboard_content" ]]; then
        last_clipboard_content="$current_clipboard_content"
    fi

    sleep 1
  done
}

validate_file() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    print_error "File not found: $file"
    return 1
  fi

   local mime_type=$(file --mime-type -b "$file" 2>/dev/null || echo "")
   if [[ -z "$mime_type" ]]; then
       print_error "Could not determine mime type for $file."
       return 1
   fi
   if [[ ! "$mime_type" =~ ^(image|video)/ ]]; then
     print_error "Invalid file type ($mime_type). Only images and videos are supported."
     return 1
   fi

   return 0
}

delete_file() {
  local id="$1"
  local api_key="$2"

  print_status "Attempting to delete file with ID: $id" "${YELLOW}"
  call_api "DELETE" "/api/media/$id" "$api_key" || return 1
  print_success "File deleted successfully (or did not exist)."
}

usage() {
  printf "%sAnonHost CLI v%s%s\n" "${BOLD}" "${VERSION}" "${NC}"
  printf "A command-line interface for AnonHost media sharing\n"
  printf "\n"
  printf "%sUsage:%s %s <command> [options]\n" "${BOLD}" "${NC}" "$SCRIPT_NAME"
  printf "\n"
  printf "%sCommands:%s\n" "${BOLD}" "${NC}"
  printf "  upload <file> [options]   Upload a file\n"
  printf "    -p, --public         Make the file public (default: false)\n"
  printf "    -d, --domain=DOMAIN  Use custom domain (if configured)\n"
  printf "\n"
  printf "  list [options]           List uploaded files\n"
  printf "    -p, --page=NUM       Page number (default: 1)\n"
  printf "    -l, --limit=NUM      Items per page (default: 20)\n"
  printf "    -s, --sort=FIELD     Sort by field (default: createdAt)\n"
  printf "                         (Options: filename, size, createdAt, type)\n"
  printf "    -o, --order=DIR      Sort direction (default: desc)\n"
  printf "                         (Options: asc, desc)\n"
  printf "\n"
  printf "  watch                    Watch clipboard for media file paths to upload\n"
  printf "  delete <id>              Delete a file by its ID\n"
  printf "  stats                    Show account statistics\n"
  printf "  configure <api-key>      Save your API key to %s\n" "$CONFIG_FILE"
  printf "  config-path              Show the path to the configuration file\n"
  printf "  version                  Show version information\n"
  printf "  help                     Show this help message\n"
  printf "\n"
  printf "%sEnvironment variables:%s\n" "${BOLD}" "${NC}"
  printf "  API_URL                Override the default API URL (%s)\n" "${API_URL:-https://anon.love}"
  printf "  ANONHOST_API_KEY       Set API key without using 'configure'\n"
  printf "                         (Note: 'configure' command takes precedence)\n"
  printf "\n"
  printf "%sExamples:%s\n" "${BOLD}" "${NC}"
  printf "  %s upload image.png -p\n" "$SCRIPT_NAME"
  printf "  %s upload video.mp4 --domain=custom.com\n" "$SCRIPT_NAME"
  printf "  %s list --page=2 --limit=50 --sort=size --order=asc\n" "$SCRIPT_NAME"
  printf "  %s watch\n" "$SCRIPT_NAME"
  printf "  %s stats\n" "$SCRIPT_NAME"
  printf "  %s configure YOUR_API_KEY_HERE\n" "$SCRIPT_NAME"
  printf "  ANONHOST_API_KEY=YOUR_KEY %s list\n" "$SCRIPT_NAME"
  exit 1
}

main() {
  check_dependencies
  setup_config

  local api_key=$(get_api_key)
  if [[ -z "$api_key" && -n "$ANONHOST_API_KEY" ]]; then
      api_key="$ANONHOST_API_KEY"
  fi

  local command="${1:-help}"
  shift || true

  case "$command" in
    upload)
      local file=""
      local public="false"
      local domain=""
      while [[ $# -gt 0 ]]; do
        local key="$1"
        case $key in
          -p|--public)
            public="true"
            shift
            ;;
          -d|--domain)
            domain="$2"
            shift
            shift
            ;;
          --domain=*)
            domain="${key#*=}"
            shift
            ;;
          -*)
            print_error "Unknown option: $1"
            usage
            ;;
          *)
            if [[ -n "$file" ]]; then
                print_error "Multiple file paths provided. Only one is allowed."
                usage
            fi
            file="$1"
            shift
            ;;
        esac
      done

      if [[ -z "$file" ]]; then
          print_error "File path is required for upload."
          usage
      fi
      if [[ -z "$api_key" ]]; then print_error "No API key configured. Use '$SCRIPT_NAME configure <key>' or set ANONHOST_API_KEY."; exit 1; fi
      upload_file "$file" "$public" "$api_key" "$domain"
      ;;

    list)
      local page=1
      local limit=20
      local sort="createdAt"
      local order="desc"
      while [[ $# -gt 0 ]]; do
        local key="$1"
        case $key in
          -p|--page) page="$2"; shift; shift ;;
          --page=*) page="${key#*=}"; shift ;;
          -l|--limit) limit="$2"; shift; shift ;;
          --limit=*) limit="${key#*=}"; shift ;;
          -s|--sort) sort="$2"; shift; shift ;;
          --sort=*) sort="${key#*=}"; shift ;;
          -o|--order) order="$2"; shift; shift ;;
          --order=*) order="${key#*=}"; shift ;;
          -*) print_error "Unknown option: $1"; usage ;;
          *) print_error "Unexpected argument: $1"; usage ;;
        esac
      done
      if [[ -z "$api_key" ]]; then print_error "No API key configured."; exit 1; fi
      list_files "$page" "$limit" "$api_key" "$sort" "$order"
      ;;

    watch)
      if [[ -z "$api_key" ]]; then print_error "No API key configured."; exit 1; fi
      watch_clipboard "$api_key"
      ;;

    stats)
      if [[ -z "$api_key" ]]; then print_error "No API key configured."; exit 1; fi
      get_stats "$api_key"
      ;;

    delete)
      local id="${1}"
      if [[ -z "$id" ]]; then print_error "File ID is required for delete."; usage; fi
      if [[ -z "$api_key" ]]; then print_error "No API key configured."; exit 1; fi
      delete_file "$id" "$api_key"
      ;;

    configure)
      local key_to_configure="${1}"
      if [[ -z "$key_to_configure" ]]; then print_error "API key is required for configure."; usage; fi
      mkdir -p "$CONFIG_DIR"
      printf "%s\n" "$key_to_configure" > "$CONFIG_FILE"
      chmod 600 "$CONFIG_FILE"
      print_success "API key configured successfully in $CONFIG_FILE"
      ;;

    config-path)
        printf "%s\n" "$CONFIG_FILE"
        ;;

    version)
      printf "%s v%s\n" "$SCRIPT_NAME" "${VERSION}"
      ;;

    help|--help|-h)
      usage
      ;;

    *)
      print_error "Unknown command '$command'"
      usage
      ;;
  esac
}

main "$@"
