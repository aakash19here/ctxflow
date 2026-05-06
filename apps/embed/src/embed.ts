import { EMBED_CONFIG } from "./config";
import { chatBubbleIcon, closeIcon } from "./icons";

(function () {
  let iframe: HTMLIFrameElement | null = null;
  let container: HTMLDivElement | null = null;
  let button: HTMLButtonElement | null = null;

  let type: "bubble" | "section" = EMBED_CONFIG.DEFAULT_TYPE;
  let isOpen = false;
  let primaryColor = "#fb2c36";
  let primaryShadow = "rgba(251, 44, 54, 0.35)";

  // Get configuration from script tag
  let position: "bottom-right" | "bottom-left" = "bottom-right";

  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript) {
    type =
      (currentScript.getAttribute("data-type") as "bubble" | "section") ||
      EMBED_CONFIG.DEFAULT_TYPE;
  } else {
    const scripts = document.querySelectorAll('script[src*="embed"]');
    const embedScript = Array.from(scripts).find((script) =>
      script.hasAttribute("data-type")
    ) as HTMLScriptElement;

    if (embedScript) {
      type =
        (embedScript.getAttribute("data-type") as "bubble" | "section") ||
        EMBED_CONFIG.DEFAULT_TYPE;
    }
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", render);
    } else {
      render();
    }
  }

  function render() {
    if (type === "bubble") {
      // Create floating action button
      button = document.createElement("button");
      button.id = "echo-widget-button";
      button.innerHTML = chatBubbleIcon;
      button.style.cssText = `
      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px ${primaryShadow};
      transition: all 0.2s ease;
    `;

      button.addEventListener("click", toggleWidget);
      button.addEventListener("mouseenter", () => {
        if (button) button.style.transform = "scale(1.05)";
      });
      button.addEventListener("mouseleave", () => {
        if (button) button.style.transform = "scale(1)";
      });

      document.body.appendChild(button);

      // Create container (hidden by default)
      container = document.createElement("div");
      container.id = "echo-widget-container";
      const isSmallUp = window.matchMedia("(min-width: 640px)").matches;
      container.style.cssText = `

      border: 1px solid oklch(0.92 0.004 286.32);

      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 90px;
      z-index: 999998;

    
      display: none; /* will be set to flex when opened */
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;

      flex: 1 1 0%;

      background-color: #ffffff;

      ${isSmallUp ? "min-width: 24rem;" : "min-width: 0;"}
      ${isSmallUp ? "width: 32%;" : "width: 24rem;"}
      ${isSmallUp ? "max-width: 40rem;" : "max-width: calc(100vw - 1rem);"}

      ${isSmallUp ? "min-height: 43.75rem;" : ""}
      ${isSmallUp ? "height: 88%;" : "height: 43.75rem;"}
      ${isSmallUp ? "max-height: calc(100vh - 6rem);" : "max-height: calc(100vh - 6rem);"}

      overflow: hidden;

      border-radius: 1rem;
    `;

      // Create iframe
      iframe = document.createElement("iframe");
      iframe.src = buildWidgetUrl();
      iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;
      // Add permissions for microphone and clipboard
      iframe.allow =
        "microphone; clipboard-read; clipboard-write; storage-access";
      // Allow sending cookies in a third-party iframe context
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;

      container.appendChild(iframe);
      document.body.appendChild(container);

      // Handle messages from widget
      window.addEventListener("message", handleMessage);
    } else if (type === "section") {
      // Create inline section container
      container = document.createElement("div");
      container.id = "echo-widget-container";

      const heightAttr =
        (currentScript && currentScript.getAttribute("data-height")) || "600px";
      const targetSelector =
        currentScript && currentScript.getAttribute("data-target");

      container.style.cssText = `
        border: 1px solid oklch(0.92 0.004 286.32);
        background-color: #ffffff;
        width: 100%;
        max-width: 100%;
        height: ${heightAttr};
        overflow: hidden;
        display: block;
        border-radius: 12px;
      `;

      // Create iframe
      iframe = document.createElement("iframe");
      iframe.src = buildWidgetUrl();
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
      `;
      iframe.allow =
        "microphone; clipboard-read; clipboard-write; storage-access";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;

      container.appendChild(iframe);

      // Insert container at target location or after the script tag
      let injected = false;
      if (targetSelector) {
        const target = document.querySelector(targetSelector);
        if (target) {
          target.appendChild(container);
          injected = true;
        }
      }
      if (!injected) {
        if (currentScript && currentScript.parentElement) {
          currentScript.insertAdjacentElement("afterend", container);
        } else {
          document.body.appendChild(container);
        }
      }

      // Handle messages from widget (e.g., dynamic height)
      window.addEventListener("message", handleMessage);

      // Section is visible by default
      isOpen = true;
    }
  }

  function buildWidgetUrl(): string {
    const params = new URLSearchParams();
    return `${EMBED_CONFIG.WIDGET_URL}?${params.toString()}`;
  }

  function handleMessage(event: MessageEvent) {
    if (event.origin !== new URL(EMBED_CONFIG.WIDGET_URL).origin) return;

    const { type, payload } = event.data;

    switch (type) {
      case "close":
        hide();
        break;
      case "resize":
        if (payload.height && container) {
          container.style.height = `${payload.height}px`;
        }
        break;
    }
  }

  function toggleWidget() {
    if (isOpen) {
      hide();
    } else {
      show();
    }
  }

  function show() {
    if (!container) return;
    isOpen = true;
    if (type === "bubble") {
      container.style.display = "block";
      // Trigger animation
      setTimeout(() => {
        if (container) {
          container.style.opacity = "1";
          container.style.transform = "translateY(0)";
        }
      }, 10);
      if (button) {
        // Change button icon to close
        button.innerHTML = closeIcon;
      }
    } else {
      container.style.display = "block";
    }
  }

  function hide() {
    if (!container) return;
    isOpen = false;
    if (type === "bubble") {
      container.style.opacity = "0";
      container.style.transform = "translateY(10px)";
      // Hide after animation
      setTimeout(() => {
        if (container) container.style.display = "none";
      }, 300);
      if (button) {
        // Change button icon back to chat
        button.innerHTML = chatBubbleIcon;
        button.style.background = primaryColor;
      }
    } else {
      container.style.display = "none";
    }
  }

  function destroy() {
    window.removeEventListener("message", handleMessage);
    if (container) {
      container.remove();
      container = null;
      iframe = null;
    }
    if (button) {
      button.remove();
      button = null;
    }
    isOpen = false;
    primaryColor = "";
    primaryShadow = "";
  }

  // Function to reinitialize with new config
  function reinit(newConfig: { position?: "bottom-right" | "bottom-left" }) {
    // Destroy existing widget
    destroy();

    // Update config
    if (newConfig.position) {
      position = newConfig.position;
    }

    // Reinitialize
    init();
  }

  // Expose API to global scope
  (window as any).CtxFlowWidget = {
    init: reinit,
    show,
    hide,
    destroy,
  };

  // Auto-initialize
  init();
})();
