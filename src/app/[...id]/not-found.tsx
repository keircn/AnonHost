export default function NotFound() {
  return (
    <div className="mt-[30vh] flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-6 py-12 bg-card border border-border shadow-lg rounded-lg text-center">
        <h2 className="text-2xl font-bold text-foreground">Image not found</h2>
        <p className="mt-2 text-muted-foreground">
          The image you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
      </div>
    </div>
  );
}
