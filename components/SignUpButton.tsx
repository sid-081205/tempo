"use client";

export default function SignUpButton() {
  function goToForm() {
    const el = document.getElementById("join");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.querySelector("input")?.focus({ preventScroll: true });
  }

  return (
    <button
      onClick={goToForm}
      className="cursor-pointer rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
    >
      Sign up
    </button>
  );
}
