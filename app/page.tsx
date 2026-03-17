import Image from "next/image";

export default function Page() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_38%,bg-background_78%)]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "96px 96px",
        }}
      />

      <div className="relative flex min-h-svh items-center justify-center px-6">
        <section className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="rounded-xl border border-border/80 bg-background/70 p-2 backdrop-blur">
            <Image
              src="/scatter-logo.svg"
              alt="Scatter logo"
              width={36}
              height={36}
              className="[image-rendering:pixelated]"
            />
          </div>

          <div className="rounded-full border border-border/80 bg-background/70 px-3 py-1 font-mono text-[10px] tracking-[0.35em] text-muted-foreground uppercase backdrop-blur">
            local first
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl font-semibold tracking-[-0.08em] sm:text-7xl md:text-8xl">
              Scatter
            </h1>
            <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
              Coming Soon.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
