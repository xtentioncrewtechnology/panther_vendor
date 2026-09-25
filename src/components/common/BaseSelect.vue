<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  useAttrs,
  watch,
  watchEffect,
} from "vue";


const attrs = useAttrs();

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: {
    type: [String, Number, null],
    default: null,
  },

  isShowMail: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "Select...",
  },
  searchable: {
    type: Boolean,
    default: false,
  },
  allowAll: {
    type: Boolean,
    default: false,
  },
  allLabel: {
    type: String,
    default: "All",
  },
  isLoading: {
    type: Boolean,
    default: false,
  },

  // Search Mode Props
  localSearch: {
    type: Boolean,
    default: false,
  },
  clientSearch: {
    type: Boolean,
    default: false,
  },
  local: {
    type: Boolean,
    default: false,
  },
  client: {
    type: Boolean,
    default: false,
  },
  frontend: {
    type: Boolean,
    default: false,
  },
  remoteSearch: {
    type: Boolean,
    default: false,
  },
  remote: {
    type: Boolean,
    default: false,
  },
  searchMode: {
    type: String,
    default: null, // 'remote' | 'local' | null
  },

  // Variant
  variant: {
    type: String,
    default: "default", // 'default' | 'surface'
  },
  showFlags: {
    type: Boolean,
    default: false,
  },
  dropUp: {
    type: Boolean,
    default: false,
  },
  placement: {
    type: String,
    default: "bottom", // 'bottom' | 'top'
  },

  // Placement
  top: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },

  // Custom Trigger Styling Props
  triggerClass: {
    type: [String, Object, Array],
    default: "",
  },
  buttonClass: {
    type: [String, Object, Array],
    default: "",
  },
  customClass: {
    type: [String, Object, Array],
    default: "",
  },
  py: {
    type: [String, Number],
    default: "",
  },
});

// ─── Emits ────────────────────────────────────────────────────────────────────
const emit = defineEmits(["update:modelValue", "search"]);

// ─── State ────────────────────────────────────────────────────────────────────
const isOpen = ref(false);
const searchQuery = ref("");
const triggerRef = ref(null);
const dropdownRef = ref(null);
const searchRef = ref(null);
const listRef = ref(null);
const dropdownStyle = ref({});
const highlightedIndex = ref(-1);

// ─── Computed ─────────────────────────────────────────────────────────────────
const allOption = computed(() => ({ label: props.allLabel, value: null }));

const baseOptions = computed(() => {
  return props.allowAll ? [allOption.value, ...props.options] : props.options;
});

const isLocalSearch = computed(() => {
  if (
    props.localSearch ||
    props.clientSearch ||
    props.local ||
    props.client ||
    props.frontend ||
    props.searchMode === "local"
  ) {
    return true;
  }
  if (props.remoteSearch || props.remote || props.searchMode === "remote") {
    return false;
  }
  // If parent provided @search event handler, assume remote API search
  if (attrs.onSearch) {
    return false;
  }
  // Otherwise default to frontend local filtering
  return true;
});

const filteredOptions = computed(() => {
  if (!isLocalSearch.value || !searchQuery.value || !searchQuery.value.trim()) {
    return baseOptions.value;
  }

  const query = searchQuery.value.toLowerCase().trim();

  return baseOptions.value.filter((option) => {
    const labelStr = (option.label ?? "").toString().toLowerCase();
    const emailStr = (option.email ?? "").toString().toLowerCase();
    if (labelStr.includes(query)) return true;
    if (emailStr.includes(query)) return true;

    if (option.value !== null && option.value !== undefined) {
      const valStr = option.value.toString().toLowerCase();
      if (valStr.includes(query)) return true;
    }

    return false;
  });
});

const selectedOption = computed(() => {
  if (
    props.modelValue === null ||
    props.modelValue === undefined ||
    props.modelValue === ""
  ) {
    return null;
  }

  const rawVal = String(props.modelValue).trim();

  // 1. Direct exact match on option.value
  let found = props.options?.find(
    (o) => String(o.value).toLowerCase() === rawVal.toLowerCase(),
  );
  if (found) return found;

  // 2. Direct exact match on option.label
  found = props.options?.find(
    (o) => String(o.label).toLowerCase() === rawVal.toLowerCase(),
  );
  if (found) return found;

  // 3. Match 2-letter country code extracted from brackets e.g. "India [IN]" -> "IN"
  const bracketMatch = rawVal.match(/\[([A-Za-z]{2})\]|\(([A-Za-z]{2})\)/);
  if (bracketMatch) {
    const code = (bracketMatch[1] || bracketMatch[2]).toUpperCase();
    found = props.options?.find(
      (o) =>
        String(o.value).toUpperCase() === code ||
        String(o.label).toUpperCase().includes(`(${code})`) ||
        String(o.label).toUpperCase().startsWith(`${code} `),
    );
    if (found) return found;
  }

  // 4. Match using getFlagCode if showFlags is true
  if (props.showFlags) {
    const flagCode = getOptionFlagCode({ value: rawVal, label: rawVal });
    if (flagCode) {
      found = props.options?.find((o) => getOptionFlagCode(o) === flagCode);
      if (found) return found;
    }
  }

  // 5. Partial / name match
  found = props.options?.find((o) => {
    const l = String(o.label || "").toLowerCase();
    const v = String(o.value || "").toLowerCase();
    const valLower = rawVal.toLowerCase();
    return (
      (v && v.length >= 2 && valLower.includes(v)) ||
      (l && (valLower.includes(l) || l.includes(valLower)))
    );
  });

  return found || null;
});

const selectedLabel = computed(() => {
  if (
    props.modelValue === null ||
    props.modelValue === undefined ||
    props.modelValue === ""
  ) {
    return props.allowAll ? props.allLabel : null;
  }

  if (selectedOption.value) {
    return selectedOption.value.label;
  }

  return String(props.modelValue);
});

const displayLabel = computed(() => selectedLabel.value ?? props.placeholder);

const isPlaceholder = computed(
  () =>
    (!selectedLabel.value && props.modelValue !== null) ||
    (!props.allowAll && (props.modelValue === null || props.modelValue === "")),
);

function getOptionFlagCode(option) {
  if (!option) return "";
  if (option.flagCode) return option.flagCode;
  return "";
}

const selectedFlagCode = computed(() => {
  if (selectedOption.value) {
    return getOptionFlagCode(selectedOption.value);
  }
  return "";
});

// Background control
const triggerBgClass = computed(() => {
  return props.variant === "surface" ? "bg-background" : "bg-card-background";
});

const triggerClassList = computed(() => {
  const custom =
    props.triggerClass || props.buttonClass || props.customClass || "";
  const customStr = typeof custom === "string" ? custom : "";
  const hasCustomPx = /\bpx-\S+/.test(customStr);
  const hasCustomPy =
    /\bpy-\S+/.test(customStr) ||
    props.py !== "" && props.py !== null && props.py !== undefined;
  const hasCustomRounded = /\brounded(-\S+)?/.test(customStr);
  const hasCustomText = /\btext-(xs|sm|base|lg|\[\S+\])/.test(customStr);

  const pyVal =
    props.py !== "" && props.py !== null && props.py !== undefined
      ? String(props.py).startsWith("py-")
        ? String(props.py)
        : `py-${props.py}`
      : "";

  return [
    "flex items-center justify-between w-full min-w-0 transition-all duration-200 ease-in-out focus:outline-none select-none border border-primary-border",
    !hasCustomPx ? "px-4" : "",
    !hasCustomPy ? "py-1" : pyVal,
    !hasCustomRounded ? "rounded-lg" : "",
    !hasCustomText ? "text-sm font-medium" : "",
    props.disabled
      ? "opacity-60 cursor-not-allowed bg-background/50 pointer-events-none"
      : "cursor-pointer",
    triggerBgClass.value,
    custom,
  ];
});

const dropdownBgClass = computed(() => {
  return props.variant === "surface" ? "bg-background" : "bg-card-background";
});

const isDropUp = computed(() => props.dropUp || props.placement === "top");

// ─── Position Calculation ─────────────────────────────────────────────────────
function updatePosition() {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  const isTop = props.top || props.position === "top";

  if (isTop) {
    dropdownStyle.value = {
      position: "fixed",
      bottom: `${window.innerHeight - rect.top + 6}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 9999,
    };
  } else {
    if (isDropUp.value) {
      dropdownStyle.value = {
        position: "fixed",
        bottom: `${window.innerHeight - rect.top + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      };
    } else {
      dropdownStyle.value = {
        position: "fixed",
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      };
    }
  }
}

// ─── Methods ──────────────────────────────────────────────────────────────────
function initHighlightedIndex() {
  if (!filteredOptions.value || !filteredOptions.value.length) {
    highlightedIndex.value = -1;
    return;
  }
  const selectedIdx = filteredOptions.value.findIndex((o) => isSelected(o));
  if (selectedIdx >= 0 && !filteredOptions.value[selectedIdx]?.disabled) {
    highlightedIndex.value = selectedIdx;
  } else {
    const firstEnabled = filteredOptions.value.findIndex((o) => !o.disabled);
    highlightedIndex.value = firstEnabled >= 0 ? firstEnabled : 0;
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    if (!listRef.value) return;
    const items = listRef.value.children;
    if (!items || highlightedIndex.value < 0 || !items[highlightedIndex.value])
      return;
    const el = items[highlightedIndex.value];
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = "";
    initHighlightedIndex();
    updatePosition();
    nextTick(() => {
      updatePosition();
      scrollToHighlighted();
      if (props.searchable) {
        searchRef.value?.focus();
      }
    });
  }
}

function close() {
  isOpen.value = false;
  searchQuery.value = "";
  highlightedIndex.value = -1;
}

function select(option) {
  emit("update:modelValue", option.value);
  close();
}

function isSelected(option) {
  if (option.value === null) {
    return (
      props.modelValue === null ||
      props.modelValue === undefined ||
      props.modelValue === ""
    );
  }
  if (selectedOption.value) {
    return String(selectedOption.value.value) === String(option.value);
  }
  return String(props.modelValue) === String(option.value);
}

watch(searchQuery, () => {
  if (isOpen.value) {
    initHighlightedIndex();
    scrollToHighlighted();
  }
});

watch(
  () => props.options,
  () => {
    if (isOpen.value) {
      initHighlightedIndex();
      scrollToHighlighted();
    }
  },
  { deep: true },
);

// ─── Outside click ────────────────────────────────────────────────────────────
function handleOutsideClick(event) {
  if (
    triggerRef.value &&
    !triggerRef.value.contains(event.target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target)
  ) {
    close();
  }
}

// ─── Scroll & Keyboard ────────────────────────────────────────────────────────
function handleScrollOrResize() {
  if (isOpen.value) {
    updatePosition();
  }
}

function handleKeydown(event) {
  if (!isOpen.value) {
    if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      (document.activeElement === triggerRef.value ||
        dropdownRef.value?.contains(document.activeElement))
    ) {
      event.preventDefault();
      toggle();
    }
    return;
  }

  if (event.key === "Escape") {
    close();
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!filteredOptions.value.length) return;
    let nextIndex = highlightedIndex.value + 1;
    while (
      nextIndex < filteredOptions.value.length &&
      filteredOptions.value[nextIndex]?.disabled
    ) {
      nextIndex++;
    }
    if (nextIndex < filteredOptions.value.length) {
      highlightedIndex.value = nextIndex;
      scrollToHighlighted();
    }
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!filteredOptions.value.length) return;
    let prevIndex = highlightedIndex.value - 1;
    while (prevIndex >= 0 && filteredOptions.value[prevIndex]?.disabled) {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      highlightedIndex.value = prevIndex;
      scrollToHighlighted();
    }
    return;
  }

  if (event.key === "Enter") {
    if (
      highlightedIndex.value >= 0 &&
      highlightedIndex.value < filteredOptions.value.length
    ) {
      event.preventDefault();
      const option = filteredOptions.value[highlightedIndex.value];
      if (option && !option.disabled) {
        select(option);
      }
    }
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleOutsideClick);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("scroll", handleScrollOrResize, true);
  window.addEventListener("resize", handleScrollOrResize);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleOutsideClick);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("scroll", handleScrollOrResize, true);
  window.removeEventListener("resize", handleScrollOrResize);
});
</script>

<template>
  <div class="relative w-full min-w-0">
    <!-- Trigger -->
    <button
      ref="triggerRef"
      type="button"
      :aria-expanded="isOpen"
      :disabled="disabled"
      @click="toggle"
      :class="triggerClassList"
    >
      <span
        :class="[
          'truncate flex items-center gap-2',
          isPlaceholder ? 'text-secondary-text' : 'text-primary-text',
        ]"
      >
        <span
          v-if="showFlags && selectedFlagCode"
          :class="[
            'fi',
            `fi-${selectedFlagCode}`,
            'fis',
            'w-4 h-3 shrink-0',
          ]"
        ></span>
        <span>{{ displayLabel }}</span>
      </span>

      <span
        class="material-symbols-outlined ml-2 shrink-0 text-secondary-text transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        style="font-size: 16px;"
      >expand_more</span>
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          role="listbox"
          :style="dropdownStyle"
          :class="[
            'max-h-56 flex flex-col rounded-lg overflow-hidden border border-primary-border shadow-lg',
            dropdownBgClass,
          ]"
        >
          <!-- Search -->
          <div
            v-if="searchable"
            class="shrink-0 px-3 py-2 border-b border-primary-border"
          >
            <div class="relative flex items-center">
              <span
                class="material-symbols-outlined absolute left-2.5 text-secondary-text pointer-events-none"
                style="font-size: 14px;"
              >search</span>
              <input
                ref="searchRef"
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-background text-primary-text placeholder:text-secondary-text focus:outline-none"
                @input="emit('search', searchQuery)"
              />
            </div>
          </div>

          <!-- Options -->
          <ul ref="listRef" class="flex-1 min-h-0 overflow-y-auto py-1">
            <li
              v-if="isLoading"
              class="px-4 py-3 text-sm text-secondary-text text-center italic"
            >
              Loading...
            </li>

            <li
              v-else-if="filteredOptions.length === 0"
              class="px-4 py-3 text-sm text-secondary-text text-center italic"
            >
              No options found
            </li>

            <li
              v-for="(option, index) in filteredOptions"
              :key="option.value ?? '__all__'"
              role="option"
              :aria-selected="isSelected(option)"
              :aria-disabled="option.disabled"
              @click="option.disabled ? null : select(option)"
              @mouseenter="highlightedIndex = index"
              :class="[
                'flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-100',
                option.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : index === highlightedIndex
                    ? 'bg-background text-primary-text cursor-pointer'
                    : 'cursor-pointer text-primary-text hover:bg-background',
              ]"
            >
              <div class="flex items-center gap-2">
                <span
                  v-if="showFlags && getOptionFlagCode(option)"
                  :class="[
                    'fi',
                    `fi-${getOptionFlagCode(option)}`,
                    'fis',
                    'w-4 h-3 shrink-0',
                  ]"
                ></span>
                <span v-if="option?.optinalLableName"
                  >{{ option.optinalLableName }} -
                </span>
                <div class="flex flex-col items-start">
                  <span
                    :class="
                      isSelected(option) && !option.disabled
                        ? 'text-primary font-medium'
                        : ''
                    "
                  >
                    {{ option.label }}
                  </span>
                  <p v-if="isShowMail">
                    <span class="text-xs">email : </span>
                    <span>{{ option?.email }}</span>
                  </p>
                </div>
              </div>

              <span
                v-if="isSelected(option) && !option.disabled"
                class="material-symbols-outlined text-primary shrink-0"
                style="font-size: 14px;"
              >check</span>
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}

ul::-webkit-scrollbar {
  width: 4px;
}
ul::-webkit-scrollbar-thumb {
  border-radius: 99px;
  background-color: var(--color-primary-border, rgba(0, 0, 0, 0.15));
}
</style>
