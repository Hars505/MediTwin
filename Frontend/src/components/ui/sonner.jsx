import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "liquid-toast a-liquid-rise",
          success:
            "liquid-toast--success",
          warning:
            "liquid-toast--warning",
          content: "flex flex-col gap-0.5",
        },
      }}
      closeButton
      richColors
      duration={2000}
      style={{
        left: "calc(50% + var(--sidebar-w, 0px) / 2)",
        transform: "translateX(-50%)",
        transition: "left 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      {...props}
    />
  );
};

export { Toaster };
