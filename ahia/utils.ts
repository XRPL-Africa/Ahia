export function triggerHaptic(pattern: number[]): void {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

export function formatNaira(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}
