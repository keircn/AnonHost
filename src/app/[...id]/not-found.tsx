export default function NotFound() {
  return (
    <div className="bg-background mt-[30vh] flex items-center justify-center">
      <div className="bg-card border-border w-full max-w-md rounded-lg border px-6 py-12 text-center shadow-lg">
        <h2 className="text-foreground text-2xl font-bold">Image not found</h2>
        <p className="text-muted-foreground mt-2">
          The image you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
      </div>
    </div>
  );
}
