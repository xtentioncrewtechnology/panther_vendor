<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Clock,
  Check,
} from "lucide-vue-next";
import moment from "moment";

// ─── Props ──────────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: {
    type: [Date, String, Number, Array, Object, null],
    default: null,
  },
  // Mode: 'single' | 'range'
  mode: {
    type: String,
    default: "single",
    validator: (v) => ["single", "range"].includes(v),
  },
  range: {
    type: Boolean,
    default: false,
  },
  // Enable Time Picker
  enableTime: {
    type: Boolean,
    default: false,
  },
  showTime: {
    type: Boolean,
    default: false,
  },
  timeFormat: {
    type: String,
    default: "24h", // '12h' | '24h'
  },
  // Presets
  showPresets: {
    type: Boolean,
    default: null, // null = auto (true for range, false for single)
  },
  presets: {
    type: Array,
    default: null,
  },
  // Value Format ('YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', 'ISO', 'Date', 'object', 'array')
  valueFormat: {
    type: String,
    default: "YYYY-MM-DD",
  },
  displayFormat: {
    type: String,
    default: null,
  },
  placeholder: {
    type: String,
    default: null,
  },
  // Restrictions
  minDate: {
    type: [Date, String, Number],
    default: null,
  },
  maxDate: {
    type: [Date, String, Number],
    default: null,
  },
  disabledDates: {
    type: [Function, Array],
    default: null,
  },
  disableFuture: {
    type: Boolean,
    default: true,
  },
  disableFutureDates: {
    type: Boolean,
    default: null,
  },
  blockFuture: {
    type: Boolean,
    default: null,
  },
  // UI Variant & Positioning
  variant: {
    type: String,
    default: "default", // 'default' | 'surface'
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  placement: {
    type: String,
    default: "bottom", // 'bottom' | 'top'
  },
  position: {
    type: String,
    default: null, // alias for placement ('bottom' | 'top')
  },
  autoApply: {
    type: Boolean,
    default: false,
  },
  // Custom Trigger Button Styling
  triggerClass: {
    type: [String, Object, Array],
    default: "",
  },
  buttonClass: {
    type: [String, Object, Array],
    default: "",
  },
  inputClass: {
    type: [String, Object, Array],
    default: "",
  },
  customClass: {
    type: [String, Object, Array],
    default: "",
  },
});

// ─── Emits ──────────────────────────────────────────────────────────────────
const emit = defineEmits(["update:modelValue", "change", "clear", "open", "close"]);

// ─── Computed Mode & Restrictions ───────────────────────────────────────────
const shouldDisableFuture = computed(() => {
  if (props.disableFutureDates !== null) return props.disableFutureDates;
  if (props.blockFuture !== null) return props.blockFuture;
  return props.disableFuture;
});

const isRangeMode = computed(() => props.range || props.mode === "range");
const isTimeEnabled = computed(() => props.enableTime || props.showTime);

const effectiveShowPresets = computed(() => {
  if (props.showPresets !== null) return props.showPresets;
  return isRangeMode.value;
});

const defaultPresets = [
  {
    label: "Today",
    getValue: () => [
      moment().startOf("day"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Yesterday",
    getValue: () => [
      moment().subtract(1, "day").startOf("day"),
      moment().subtract(1, "day").endOf("day"),
    ],
  },
  {
    label: "Last 7 Days",
    getValue: () => [
      moment().subtract(6, "days").startOf("day"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Last 14 Days",
    getValue: () => [
      moment().subtract(13, "days").startOf("day"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Last 30 Days",
    getValue: () => [
      moment().subtract(29, "days").startOf("day"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Last 90 Days",
    getValue: () => [
      moment().subtract(89, "days").startOf("day"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Month to Date",
    getValue: () => [
      moment().startOf("month"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Last Month",
    getValue: () => [
      moment().subtract(1, "month").startOf("month"),
      moment().subtract(1, "month").endOf("month"),
    ],
  },
  {
    label: "Quarter to Date",
    getValue: () => [
      moment().startOf("quarter"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Year to Date",
    getValue: () => [
      moment().startOf("year"),
      moment().endOf("day"),
    ],
  },
];

const activePresets = computed(() => {
  return props.presets || defaultPresets;
});

// ─── Reactive State ─────────────────────────────────────────────────────────
const isOpen = ref(false);
const triggerRef = ref(null);
const dropdownRef = ref(null);
const dropdownStyle = ref({});

const viewYear = ref(moment().year());
const viewMonth = ref(moment().month()); // 0-11
const pickerView = ref("days"); // 'days' | 'months' | 'years'

// Draft Selection State
const tempStart = ref(null); // moment object or null
const tempEnd = ref(null); // moment object or null
const hoverDate = ref(null); // moment object or null
const activePresetLabel = ref(null);

// Time State
const startTime = ref({ hours: 0, minutes: 0 });
const endTime = ref({ hours: 23, minutes: 59 });

// ─── Weekdays & Months Data ─────────────────────────────────────────────────
const weekDays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const viewTitle = computed(() => {
  if (pickerView.value === "years") return `${viewYear.value - 6} - ${viewYear.value + 5}`;
  if (pickerView.value === "months") return `${viewYear.value}`;
  return `${monthNames[viewMonth.value]} ${viewYear.value}`;
});

const yearRange = computed(() => {
  const current = viewYear.value;
  const years = [];
  for (let i = current - 12; i <= current + 12; i++) {
    years.push(i);
  }
  return years;
});

// ─── Parsing & Formatting Helpers ───────────────────────────────────────────
function parseDate(val) {
  if (!val) return null;
  if (moment.isMoment(val)) return val.isValid() ? val.clone() : null;
  if (val instanceof Date) return moment(val);
  if (typeof val === "string" || typeof val === "number") {
    const m = moment(val);
    return m.isValid() ? m : null;
  }
  return null;
}

function parseModelValue(val) {
  if (!val) return { start: null, end: null };

  if (isRangeMode.value) {
    if (Array.isArray(val)) {
      return {
        start: parseDate(val[0]),
        end: parseDate(val[1]),
      };
    }
    if (typeof val === "object") {
      const s = val.start || val.from || val.startDate;
      const e = val.end || val.to || val.endDate;
      return {
        start: parseDate(s),
        end: parseDate(e),
      };
    }
  }

  const single = parseDate(val);
  return { start: single, end: single };
}

function formatSingleOutput(m) {
  if (!m) return null;
  if (props.valueFormat === "Date") return m.toDate();
  if (props.valueFormat === "ISO") return m.toISOString();
  if (props.valueFormat === "timestamp") return m.valueOf();
  const fmt = isTimeEnabled.value
    ? props.valueFormat === "YYYY-MM-DD"
      ? "YYYY-MM-DD HH:mm:ss"
      : props.valueFormat
    : props.valueFormat;
  return m.format(fmt);
}

function formatOutput(s, e) {
  if (!isRangeMode.value) {
    return formatSingleOutput(s);
  }

  const formattedStart = formatSingleOutput(s);
  const formattedEnd = formatSingleOutput(e);

  if (Array.isArray(props.modelValue)) {
    return [formattedStart, formattedEnd];
  }
  return {
    start: formattedStart,
    end: formattedEnd,
  };
}

// ─── Label Computations ─────────────────────────────────────────────────────
const hasValue = computed(() => {
  const { start, end } = parseModelValue(props.modelValue);
  return Boolean(start);
});

const isPlaceholder = computed(() => !hasValue.value);

const defaultDisplayFmt = computed(() => {
  if (props.displayFormat) return props.displayFormat;
  return isTimeEnabled.value ? "MMM D, YYYY HH:mm" : "MMM D, YYYY";
});

const matchedPreset = computed(() => {
  if (!isRangeMode.value) return null;
  const { start, end } = parseModelValue(props.modelValue);
  if (!start || !end) return null;

  if (activePresetLabel.value) {
    const found = activePresets.value.find((p) => p.label === activePresetLabel.value);
    if (found) {
      try {
        const [s, e] = found.getValue();
        const sM = parseDate(s);
        const eM = parseDate(e);
        if (sM && eM && sM.isSame(start, "day") && eM.isSame(end, "day")) {
          return found;
        }
      } catch {
        // ignore
      }
    }
  }

  return (
    activePresets.value.find((p) => {
      try {
        const [s, e] = p.getValue();
        const sM = parseDate(s);
        const eM = parseDate(e);
        return sM && eM && sM.isSame(start, "day") && eM.isSame(end, "day");
      } catch {
        return false;
      }
    }) || null
  );
});

const displayLabel = computed(() => {
  const { start, end } = parseModelValue(props.modelValue);
  if (!start) {
    if (props.placeholder) return props.placeholder;
    return isRangeMode.value ? "Select date range" : "Select date";
  }

  const fmt = defaultDisplayFmt.value;
  if (!isRangeMode.value || !end) {
    return start.format(fmt);
  }

  if (start.isSame(end, "day") && !isTimeEnabled.value) {
    const isToday = start.isSame(moment(), "day");
    const isYesterday = start.isSame(moment().subtract(1, "day"), "day");
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return start.format(fmt);
  }

  if (matchedPreset.value) {
    return `${matchedPreset.value.label} (${start.format("MMM D")} - ${end.format("MMM D")})`;
  }

  if (start.year() === end.year()) {
    return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
  }

  return `${start.format("MMM D, YYYY")} - ${end.format("MMM D, YYYY")}`;
});

const draftSummaryText = computed(() => {
  if (!tempStart.value) return "No date selected";
  const fmt = defaultDisplayFmt.value;
  if (!isRangeMode.value) {
    return tempStart.value.format(fmt);
  }
  if (!tempEnd.value) {
    return `${tempStart.value.format(fmt)} - Select end date`;
  }
  return `${tempStart.value.format(fmt)} - ${tempEnd.value.format(fmt)}`;
});

const isDraftValid = computed(() => {
  if (!tempStart.value) return false;
  if (isRangeMode.value && !tempEnd.value) return false;
  return true;
});

// ─── Calendar Cells Calculation ─────────────────────────────────────────────
const calendarCells = computed(() => {
  const cells = [];
  const startOfMonth = moment([viewYear.value, viewMonth.value, 1]);
  const daysInMonth = startOfMonth.daysInMonth();
  const firstDayOfWeek = startOfMonth.day(); // 0 = Sun

  const prevMonth = startOfMonth.clone().subtract(1, "month");
  const daysInPrevMonth = prevMonth.daysInMonth();

  // Prev Month Days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonth.clone().date(daysInPrevMonth - i);
    cells.push(createCellObject(d, false));
  }

  // Current Month Days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = startOfMonth.clone().date(i);
    cells.push(createCellObject(d, true));
  }

  // Next Month Days
  const totalSlots = cells.length > 35 ? 42 : 35;
  const remaining = totalSlots - cells.length;
  const nextMonth = startOfMonth.clone().add(1, "month");
  for (let i = 1; i <= remaining; i++) {
    const d = nextMonth.clone().date(i);
    cells.push(createCellObject(d, false));
  }

  return cells;
});

function isDateDisabled(mDate) {
  if (shouldDisableFuture.value && mDate.isAfter(moment(), "day")) {
    return true;
  }
  if (props.minDate) {
    const minM = parseDate(props.minDate);
    if (minM && mDate.isBefore(minM, "day")) return true;
  }
  if (props.maxDate) {
    const maxM = parseDate(props.maxDate);
    if (maxM && mDate.isAfter(maxM, "day")) return true;
  }
  if (typeof props.disabledDates === "function") {
    if (props.disabledDates(mDate.toDate())) return true;
  }
  if (Array.isArray(props.disabledDates)) {
    return props.disabledDates.some((d) => mDate.isSame(parseDate(d), "day"));
  }
  return false;
}

function createCellObject(mDate, isCurrentMonth) {
  const isToday = mDate.isSame(moment(), "day");
  const isDisabled = isDateDisabled(mDate);

  const isSelStart = tempStart.value ? mDate.isSame(tempStart.value, "day") : false;
  const isSelEnd = tempEnd.value ? mDate.isSame(tempEnd.value, "day") : false;

  let isInRange = false;
  if (isRangeMode.value && tempStart.value && tempEnd.value) {
    isInRange = mDate.isBetween(tempStart.value, tempEnd.value, "day", "()");
  }

  let isInHoverRange = false;
  if (isRangeMode.value && tempStart.value && !tempEnd.value && hoverDate.value) {
    if (hoverDate.value.isAfter(tempStart.value, "day")) {
      isInHoverRange = mDate.isBetween(tempStart.value, hoverDate.value, "day", "()");
    }
  }

  return {
    date: mDate,
    dayNumber: mDate.date(),
    isCurrentMonth,
    isToday,
    isDisabled,
    isSelectedStart: isSelStart,
    isSelectedEnd: isSelEnd,
    isInRange,
    isInHoverRange,
  };
}

// ─── Cell Styling Handler ───────────────────────────────────────────────────
function getDayCellClass(cell) {
  const base =
    "w-8 h-8 flex items-center justify-center text-xs transition-all duration-150 relative select-none cursor-pointer";

  if (cell.isDisabled) {
    return `${base} opacity-30 cursor-not-allowed text-secondary-text`;
  }

  // Selected Start and/or End
  if (cell.isSelectedStart && cell.isSelectedEnd) {
    return `${base} rounded-full bg-primary text-white font-bold shadow-md z-10`;
  }
  if (cell.isSelectedStart) {
    return isRangeMode.value && tempEnd.value
      ? `${base} rounded-l-lg rounded-r-none bg-primary text-white font-bold shadow-md z-10`
      : `${base} rounded-lg bg-primary text-white font-bold shadow-md z-10`;
  }
  if (cell.isSelectedEnd) {
    return `${base} rounded-r-lg rounded-l-none bg-primary text-white font-bold shadow-md z-10`;
  }

  // In Range / In Hover Range
  if (cell.isInRange) {
    return `${base} bg-primary/20 text-primary-text font-medium rounded-none`;
  }
  if (cell.isInHoverRange) {
    return `${base} bg-primary/15 text-primary-text font-normal rounded-none border-t border-b border-dashed border-primary/40`;
  }

  // Current Month vs Out Month
  if (!cell.isCurrentMonth) {
    return `${base} text-secondary-text/30 hover:text-secondary-text hover:bg-background hover:rounded-md`;
  }

  return `${base} text-primary-text hover:bg-background hover:rounded-md font-medium`;
}

// ─── Positioning & Styling Logic ────────────────────────────────────────────
const triggerBgClass = computed(() => {
  return props.variant === "surface" ? "bg-background" : "bg-card-background";
});

const triggerClassList = computed(() => {
  const custom =
    props.triggerClass ||
    props.buttonClass ||
    props.inputClass ||
    props.customClass ||
    "";

  const customStr = Array.isArray(custom)
    ? custom.filter(Boolean).join(" ")
    : typeof custom === "object" && custom !== null
    ? Object.keys(custom)
        .filter((k) => custom[k])
        .join(" ")
    : String(custom || "");

  const hasCustomPy = /\bpy-\S+/.test(customStr);
  const hasCustomPx = /\bpx-\S+/.test(customStr);
  const hasCustomRounded = /\brounded\S*/.test(customStr);
  const hasCustomText = /\btext-(xs|sm|base|lg|\[\S+\])/.test(customStr);

  return [
    "flex items-center justify-between w-full min-w-0 transition-all duration-200 ease-in-out focus:outline-none select-none border border-primary-border",
    !hasCustomPx ? "px-3.5" : "",
    !hasCustomPy ? "py-1" : "",
    !hasCustomRounded ? "rounded-lg" : "",
    !hasCustomText ? "text-sm font-medium" : "",
    props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    triggerBgClass.value,
    custom,
  ];
});

const dropdownBgClass = computed(() => {
  return props.variant === "surface" ? "bg-background" : "bg-card-background";
});

function updatePosition() {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  const isTop = props.placement === "top" || props.position === "top";

  const dropdownWidth = effectiveShowPresets.value ? 520 : 340;
  let left = rect.left;
  if (left + dropdownWidth > window.innerWidth - 12) {
    left = Math.max(12, window.innerWidth - dropdownWidth - 12);
  }

  if (isTop) {
    dropdownStyle.value = {
      position: "fixed",
      bottom: `${window.innerHeight - rect.top + 6}px`,
      left: `${left}px`,
      zIndex: 9999,
    };
  } else {
    dropdownStyle.value = {
      position: "fixed",
      top: `${rect.bottom + 6}px`,
      left: `${left}px`,
      zIndex: 9999,
    };
  }
}

// ─── Methods ────────────────────────────────────────────────────────────────
function initFromModel() {
  const { start, end } = parseModelValue(props.modelValue);
  tempStart.value = start;
  tempEnd.value = end;

  if (start) {
    viewYear.value = start.year();
    viewMonth.value = start.month();
    startTime.value = { hours: start.hours(), minutes: start.minutes() };
  } else {
    viewYear.value = moment().year();
    viewMonth.value = moment().month();
  }

  if (end) {
    endTime.value = { hours: end.hours(), minutes: end.minutes() };
  }
  activePresetLabel.value = matchedPreset.value?.label || null;
}

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    initFromModel();
    pickerView.value = "days";
    updatePosition();
    emit("open");
  } else {
    emit("close");
  }
}

function close() {
  isOpen.value = false;
  hoverDate.value = null;
  emit("close");
}

function clear() {
  tempStart.value = null;
  tempEnd.value = null;
  activePresetLabel.value = null;
  emit("update:modelValue", null);
  emit("change", null);
  emit("clear");
}

function selectDate(mDate) {
  if (isDateDisabled(mDate)) return;
  activePresetLabel.value = null;

  if (!isRangeMode.value) {
    tempStart.value = mDate.clone();
    tempEnd.value = mDate.clone();
    if (props.autoApply && !isTimeEnabled.value) {
      apply();
    }
    return;
  }

  // Range Mode
  if (!tempStart.value || (tempStart.value && tempEnd.value)) {
    tempStart.value = mDate.clone();
    tempEnd.value = null;
  } else if (tempStart.value && !tempEnd.value) {
    if (mDate.isBefore(tempStart.value, "day")) {
      tempStart.value = mDate.clone();
      tempEnd.value = null;
    } else {
      tempEnd.value = mDate.clone();
      if (props.autoApply && !isTimeEnabled.value) {
        apply();
      }
    }
  }
}

function onCellMouseEnter(mDate) {
  if (isRangeMode.value && tempStart.value && !tempEnd.value) {
    if (isDateDisabled(mDate)) return;
    hoverDate.value = mDate;
  }
}

function onCellMouseLeave() {
  hoverDate.value = null;
}

function applyPreset(preset) {
  activePresetLabel.value = preset.label;
  const [s, e] = preset.getValue();
  tempStart.value = s ? parseDate(s) : null;
  tempEnd.value = e ? parseDate(e) : null;

  if (tempStart.value) {
    viewYear.value = tempStart.value.year();
    viewMonth.value = tempStart.value.month();
  }

  if (props.autoApply) {
    apply();
  }
}

function prevMonth() {
  if (pickerView.value === "years") {
    viewYear.value -= 12;
    return;
  }
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value--;
  } else {
    viewMonth.value--;
  }
}

function nextMonth() {
  if (pickerView.value === "years") {
    viewYear.value += 12;
    return;
  }
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value++;
  } else {
    viewMonth.value++;
  }
}

function togglePickerView() {
  if (pickerView.value === "days") pickerView.value = "months";
  else if (pickerView.value === "months") pickerView.value = "years";
  else pickerView.value = "days";
}

function selectMonth(idx) {
  viewMonth.value = idx;
  pickerView.value = "days";
}

function selectYear(yr) {
  viewYear.value = yr;
  pickerView.value = "months";
}

function cancel() {
  close();
}

function apply() {
  if (!tempStart.value) return;

  let finalStart = tempStart.value.clone();
  let finalEnd = tempEnd.value ? tempEnd.value.clone() : finalStart.clone();

  if (isTimeEnabled.value) {
    finalStart.hours(startTime.value.hours).minutes(startTime.value.minutes);
    finalEnd.hours(endTime.value.hours).minutes(endTime.value.minutes);
  }

  const formatted = formatOutput(finalStart, finalEnd);
  emit("update:modelValue", formatted);
  emit("change", formatted);
  close();
}

// Outside Click Listener
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

function handleScrollOrResize() {
  if (isOpen.value) {
    updatePosition();
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleOutsideClick);
  window.addEventListener("scroll", handleScrollOrResize, true);
  window.addEventListener("resize", handleScrollOrResize);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleOutsideClick);
  window.removeEventListener("scroll", handleScrollOrResize, true);
  window.removeEventListener("resize", handleScrollOrResize);
});

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      initFromModel();
    }
  },
);
</script>

<template>
  <div class="relative w-full min-w-0">
    <!-- Trigger Button -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      :aria-expanded="isOpen"
      @click="toggle"
      :class="triggerClassList"
    >
      <div class="flex items-center gap-2 truncate min-w-0">
        <Calendar :size="16" class="flex-shrink-0 text-secondary-text" />
        <span
          :class="[
            'truncate text-sm',
            isPlaceholder ? 'text-secondary-text' : 'text-primary-text font-medium',
          ]"
        >
          {{ displayLabel }}
        </span>
      </div>

      <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <X
          v-if="clearable && hasValue && !disabled"
          :size="14"
          class="text-secondary-text hover:text-primary-red transition-colors p-0.5 cursor-pointer rounded"
          @click.stop="clear"
        />
        <ChevronDown
          :size="16"
          class="text-secondary-text transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
        />
      </div>
    </button>

    <!-- Dropdown / Popover -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          :style="dropdownStyle"
          :class="[
            'flex flex-col rounded-xl overflow-hidden border border-primary-border shadow-2xl z-[9999]',
            dropdownBgClass,
          ]"
        >
          <div class="flex flex-col sm:flex-row">
            <!-- Left Sidebar Presets -->
            <div
              v-if="effectiveShowPresets"
              class="w-full sm:w-44 border-b sm:border-b-0 sm:border-r border-primary-border flex flex-col shrink-0 bg-background/50"
            >
              <div class="p-2 space-y-0.5 max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar">
                <button
                  v-for="preset in activePresets"
                  :key="preset.label"
                  type="button"
                  @click="applyPreset(preset)"
                  :class="[
                    'w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between cursor-pointer',
                    activePresetLabel === preset.label
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-primary-text hover:bg-background hover:text-primary-text',
                  ]"
                >
                  <span>{{ preset.label }}</span>
                  <Check
                    v-if="activePresetLabel === preset.label"
                    :size="13"
                    class="text-primary shrink-0 ml-1"
                  />
                </button>
              </div>
            </div>

            <!-- Calendar Container -->
            <div class="p-4 flex flex-col gap-3 min-w-[280px] sm:min-w-[320px]">
              <!-- Header -->
              <div class="flex items-center justify-between px-1">
                <button
                  type="button"
                  @click="prevMonth"
                  class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
                >
                  <ChevronLeft :size="16" />
                </button>

                <button
                  type="button"
                  @click="togglePickerView"
                  class="text-sm font-semibold text-primary-text hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-background cursor-pointer flex items-center gap-1"
                >
                  <span>{{ viewTitle }}</span>
                  <ChevronDown :size="14" class="text-secondary-text" />
                </button>

                <button
                  type="button"
                  @click="nextMonth"
                  class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
                >
                  <ChevronRight :size="16" />
                </button>
              </div>

              <!-- View: Days Grid -->
              <div v-if="pickerView === 'days'" class="space-y-2">
                <!-- Weekday Headers -->
                <div class="grid grid-cols-7 gap-1 text-center">
                  <span
                    v-for="day in weekDays"
                    :key="day"
                    class="text-[11px] font-semibold text-secondary-text uppercase py-1"
                  >
                    {{ day }}
                  </span>
                </div>

                <!-- Days Grid -->
                <div class="grid grid-cols-7 gap-y-1 gap-x-0 text-center">
                  <div
                    v-for="(cell, index) in calendarCells"
                    :key="index"
                    class="relative py-0.5"
                    @mouseenter="onCellMouseEnter(cell.date)"
                    @mouseleave="onCellMouseLeave"
                  >
                    <button
                      type="button"
                      :disabled="cell.isDisabled"
                      @click="selectDate(cell.date)"
                      :class="getDayCellClass(cell)"
                    >
                      <span>{{ cell.dayNumber }}</span>
                      <span
                        v-if="cell.isToday && !cell.isSelectedStart && !cell.isSelectedEnd"
                        class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      ></span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- View: Months Grid -->
              <div v-else-if="pickerView === 'months'" class="grid grid-cols-3 gap-2 py-2">
                <button
                  v-for="(mName, mIdx) in monthNames"
                  :key="mName"
                  type="button"
                  @click="selectMonth(mIdx)"
                  :class="[
                    'py-2 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                    viewMonth === mIdx
                      ? 'bg-primary text-white font-semibold'
                      : 'text-primary-text hover:bg-background',
                  ]"
                >
                  {{ mName }}
                </button>
              </div>

              <!-- View: Years Grid -->
              <div
                v-else-if="pickerView === 'years'"
                class="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1"
              >
                <button
                  v-for="yr in yearRange"
                  :key="yr"
                  type="button"
                  @click="selectYear(yr)"
                  :class="[
                    'py-2 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                    viewYear === yr
                      ? 'bg-primary text-white font-semibold'
                      : 'text-primary-text hover:bg-background',
                  ]"
                >
                  {{ yr }}
                </button>
              </div>

              <!-- Time Picker Section -->
              <div
                v-if="isTimeEnabled && pickerView === 'days'"
                class="pt-3 border-t border-primary-border flex flex-col gap-2"
              >
                <div class="flex items-center justify-between text-xs text-secondary-text">
                  <span class="flex items-center gap-1.5 font-medium">
                    <Clock :size="14" />
                    <span>{{ isRangeMode ? 'Select Time Range' : 'Select Time' }}</span>
                  </span>
                </div>

                <!-- Single or Start Time -->
                <div class="flex items-center gap-2 text-xs">
                  <span v-if="isRangeMode" class="text-secondary-text text-[11px] w-10">Start:</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    v-model.number="startTime.hours"
                    class="w-12 px-2 py-1 rounded bg-background border border-primary-border text-center text-primary-text focus:border-primary outline-none"
                  />
                  <span class="font-bold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    v-model.number="startTime.minutes"
                    class="w-12 px-2 py-1 rounded bg-background border border-primary-border text-center text-primary-text focus:border-primary outline-none"
                  />
                </div>

                <!-- End Time (for Range Mode) -->
                <div v-if="isRangeMode" class="flex items-center gap-2 text-xs">
                  <span class="text-secondary-text text-[11px] w-10">End:</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    v-model.number="endTime.hours"
                    class="w-12 px-2 py-1 rounded bg-background border border-primary-border text-center text-primary-text focus:border-primary outline-none"
                  />
                  <span class="font-bold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    v-model.number="endTime.minutes"
                    class="w-12 px-2 py-1 rounded bg-background border border-primary-border text-center text-primary-text focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Bar -->
          <div
            class="px-4 py-2.5 bg-background/80 border-t border-primary-border flex items-center justify-between text-xs"
          >
            <span class="text-secondary-text truncate mr-2 font-medium">
              {{ draftSummaryText }}
            </span>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="cancel"
                class="px-3 py-1.5 rounded-lg border border-primary-border text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="apply"
                :disabled="!isDraftValid"
                class="px-3.5 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>
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

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  border-radius: 99px;
  background-color: var(--color-primary-border, rgba(255, 255, 255, 0.15));
}
</style>
