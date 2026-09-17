import { Toaster as Sonner } from "sonner";

function Toaster() {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "bg-card text-foreground border-border shadow-border",
        },
      }}
    />
  );
}

export { Toaster };
