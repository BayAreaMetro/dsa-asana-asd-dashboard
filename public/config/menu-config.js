const menuConfig = {
  title: 'DSA Dashboard',
  items: [
    {
      id: 'portfolio',
      title: 'Work Plan Status',
      icon: '📊',
      action: 'showSection',
      active: true
    },
    {
      id: 'quarterly',
      title: 'Quarterly Reports',
      icon: '📅',
      action: 'toggleSubmenu',
      submenu: [
        { id: 'q1-2025', title: 'Q1 2025', action: 'showQuarterly' },
        { id: 'q2-2025', title: 'Q2 2025', action: 'showQuarterly' },
        // { id: 'q3-2026', title: 'Q3 2026', action: 'showQuarterly' },
        // { id: 'q4-2026', title: 'Q4 2026', action: 'showQuarterly' }
      ]
    },
    {
      id: 'goals',
      title: 'Goals & Objectives',
      icon: '🎯',
      action: 'showSection'
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = menuConfig;
} else {
  window.menuConfig = menuConfig;
}