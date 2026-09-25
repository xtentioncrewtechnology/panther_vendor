const fs = require('fs');
const path = require('path');

const files = [
  'src/components/common/DataTable/DataTableColumnMenu.vue',
  'src/components/common/DataTable/DataTableBody.vue',
  'src/components/common/DataTable/DataTablePagination.vue',
  'src/components/common/snackbar.vue',
  'src/components/common/DataTable/DataTableHeader.vue',
  'src/components/common/BaseDatePicker.vue'
];

const iconMap = {
  'ChevronDown': 'expand_more',
  'ChevronUp': 'expand_less',
  'ChevronLeft': 'chevron_left',
  'ChevronRight': 'chevron_right',
  'Check': 'check',
  'Search': 'search',
  'X': 'close',
  'Calendar': 'calendar_today',
  'Clock': 'schedule',
  'Settings2': 'settings',
  'Eye': 'visibility',
  'EyeOff': 'visibility_off',
  'Filter': 'filter_alt',
  'MoreVertical': 'more_vert',
  'MoreHorizontal': 'more_horiz',
  'ArrowUp': 'arrow_upward',
  'ArrowDown': 'arrow_downward',
  'AlertCircle': 'error',
  'CheckCircle': 'check_circle',
  'Info': 'info',
  'XCircle': 'cancel'
};

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Remove import
  content = content.replace(/import\s+\{[\s\S]*?\}\s+from\s+["']lucide-vue-next["'];?/g, '');
  
  // Replace icon tags
  for (const [lucide, material] of Object.entries(iconMap)) {
    // Self-closing tags: <IconName class="..." :size="16" />
    const selfClosingRegex = new RegExp(`<${lucide}\\b([^>]*?)\\s*\\/?>`, 'g');
    content = content.replace(selfClosingRegex, (match, attrs) => {
      // Remove size prop
      let newAttrs = attrs.replace(/:size="[^"]*"/, '').replace(/size="[^"]*"/, '');
      return `<span class="material-symbols-outlined"${newAttrs}>${material}</span>`;
    });
    // Closing tags: </IconName> (just in case)
    const closingRegex = new RegExp(`<\\/${lucide}>`, 'g');
    content = content.replace(closingRegex, `</span>`);
  }
  
  fs.writeFileSync(fullPath, content);
  console.log('Updated ' + file);
});
