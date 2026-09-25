<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  position: {
    type: String,
    default: "center",
    validator: (value) =>
      ["start", "center", "end", "right", "left", "bottom", "top"].includes(
        value,
      ),
  },
  placement: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  textSize: {
    type: String,
    default: "12px",
  },
  maxWidth: {
    type: String,
    default: "240px",
  },
});

const computedFontSizeStyle = computed(() => {
  if (props.textSize && !props.textSize.startsWith("text-")) {
    return { fontSize: props.textSize };
  }
  return {};
});

const computedTextSizeClass = computed(() => {
  if (props.textSize && props.textSize.startsWith("text-")) {
    return props.textSize;
  }
  return "";
});

const computedMaxWidthStyle = computed(() => {
  if (!props.maxWidth) return {};
  if (props.maxWidth === "none") return { maxWidth: "none" };
  if (/^\d+(\.\d+)?(px|rem|em|pt|%)$/.test(props.maxWidth)) {
    return { maxWidth: props.maxWidth };
  }
  return {};
});

const computedMaxWidthClass = computed(() => {
  if (props.maxWidth && props.maxWidth.startsWith("max-w-")) {
    return props.maxWidth;
  }
  return "";
});

const showTooltip = ref(false);
const wrapperRef = ref(null);
const actualPosition = ref(props.position);

const getTooltipStyle = () => {
  if (!wrapperRef.value) return {};
  const rect = wrapperRef.value.getBoundingClientRect();
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;

  let pos = props.position;
  if (pos === "top") pos = "center";
  if (props.placement) {
    if (props.placement === "top") pos = "center";
    else pos = props.placement;
  }

  // If target position is 'right' but wrapper is too close to right viewport boundary (< 240px space), flip to 'left'
  if (pos === "right" && viewportWidth - rect.right < 240) {
    pos = "left";
  }
  // If target position is 'left' but wrapper is too close to left viewport boundary (< 240px space), flip to 'right'
  else if (pos === "left" && rect.left < 240) {
    pos = "right";
  }

  actualPosition.value = pos;

  if (pos === "right") {
    return {
      position: "fixed",
      left: `${rect.right + 8}px`,
      top: `${rect.top + rect.height / 2}px`,
      transform: "translateY(-50%)",
      bottom: "auto",
      right: "auto",
      zIndex: "9999",
    };
  }
  if (pos === "left") {
    return {
      position: "fixed",
      left: `${Math.max(12, rect.left - 8)}px`,
      top: `${rect.top + rect.height / 2}px`,
      transform: "translate(-100%, -50%)",
      bottom: "auto",
      right: "auto",
      zIndex: "9999",
    };
  }

  const positionMap = {
    start: {
      left: "0",
      transform: "translateX(0)",
      bottom: "calc(100% + 8px)",
      top: "auto",
    },
    center: {
      left: "50%",
      transform: "translateX(-50%)",
      bottom: "calc(100% + 8px)",
      top: "auto",
    },
    end: {
      left: "100%",
      transform: "translateX(-100%)",
      bottom: "calc(100% + 8px)",
      top: "auto",
    },
    bottom: {
      left: "50%",
      transform: "translateX(-50%)",
      top: "calc(100% + 8px)",
      bottom: "auto",
    },
  };
  return positionMap[pos] || positionMap.center;
};

const tooltipStyle = ref({});

const handleMouseEnter = () => {
  if (props.disabled) return;
  tooltipStyle.value = getTooltipStyle();
  showTooltip.value = true;
};

const handleMouseLeave = () => {
  showTooltip.value = false;
};
</script>

<template>
  <div
    ref="wrapperRef"
    class="tooltip-wrapper"
    :class="{ block: block }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <slot />

    <div
      v-show="showTooltip"
      class="tooltip-popup"
      :class="[`position-${actualPosition}`, computedMaxWidthClass]"
      :style="[tooltipStyle, computedMaxWidthStyle]"
    >
      <div
        class="tooltip-content"
        :class="computedTextSizeClass"
        :style="computedFontSizeStyle"
      >
        <slot name="content">{{ text }}</slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-wrapper.block {
  display: block;
  width: 100%;
}

.tooltip-popup {
  position: absolute;
  z-index: 9999;
  width: max-content;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.tooltip-popup[style] {
  opacity: 1;
}

.tooltip-content {
  position: relative;
  background: var(--color-card-background);
  color: var(--color-primary-text);
  border: 1px solid var(--color-primary-border);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.15),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  white-space: normal;
  word-break: break-word;
  text-align: left;
}

/* Default arrow (center) */
.tooltip-content::after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--color-card-background);
  border-right: 1px solid var(--color-primary-border);
  border-bottom: 1px solid var(--color-primary-border);
  left: 50%;
  bottom: -5px;
  transform: translateX(-50%) rotate(45deg);
}

/* START */
.tooltip-popup.position-start .tooltip-content::after {
  left: 16px;
  bottom: -5px;
  transform: rotate(45deg);
}

/* CENTER */
.tooltip-popup.position-center .tooltip-content::after {
  left: 50%;
  bottom: -5px;
  transform: translateX(-50%) rotate(45deg);
}

/* END */
.tooltip-popup.position-end .tooltip-content::after {
  left: auto;
  right: 16px;
  bottom: -5px;
  transform: rotate(45deg);
}

/* RIGHT */
.tooltip-popup.position-right .tooltip-content::after {
  left: -5px;
  top: 50%;
  bottom: auto;
  border-right: none;
  border-bottom: 1px solid var(--color-primary-border);
  border-left: 1px solid var(--color-primary-border);
  transform: translateY(-50%) rotate(45deg);
}

/* LEFT */
.tooltip-popup.position-left .tooltip-content::after {
  left: auto;
  right: -5px;
  top: 50%;
  bottom: auto;
  border-bottom: none;
  border-right: 1px solid var(--color-primary-border);
  border-top: 1px solid var(--color-primary-border);
  transform: translateY(-50%) rotate(45deg);
}

/* BOTTOM */
.tooltip-popup.position-bottom .tooltip-content::after {
  left: 50%;
  top: -5px;
  bottom: auto;
  border-right: none;
  border-bottom: none;
  border-top: 1px solid var(--color-primary-border);
  border-left: 1px solid var(--color-primary-border);
  transform: translateX(-50%) rotate(45deg);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .tooltip-content {
    font-size: 11px;
    padding: 5px 10px;
  }
}
</style>
