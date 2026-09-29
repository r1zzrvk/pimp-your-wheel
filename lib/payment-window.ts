export function openPaymentWindow() {
  return window.open("about:blank", "_blank");
}

export function goToPayment(paymentWindow: Window | null, url: string) {
  if (paymentWindow && !paymentWindow.closed) {
    paymentWindow.location.replace(url);
    return;
  }
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function closePaymentWindow(paymentWindow: Window | null) {
  paymentWindow?.close();
}
