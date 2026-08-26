/**
 * @file toast.js
 * @description UX Helper utilities for Toast notifications and Modal Dialogs.
 */

/**
 * Displays a sleek toast notification banner at top-right.
 * @param {string} message 
 * @param {'success'|'error'|'info'|'warning'} type 
 * @param {number} duration 
 */
export function showToast(message, type = 'info', duration = 3500) {
  let toastContainer = document.getElementById('toastNotificationContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastNotificationContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-banner toast-${type}`;
  
  const iconMap = {
    success: `<svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error: `<svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    warning: `<svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    info: `<svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  const icon = iconMap[type] || iconMap.info;

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close-btn" aria-label="Close notification"><svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
  `;

  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  });

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

/**
 * Displays a confirm dialog modal.
 * @param {Object} config 
 */
export function showConfirmModal({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) {
  let modalOverlay = document.getElementById('adminConfirmModalOverlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'adminConfirmModalOverlay';
    modalOverlay.className = 'admin-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="admin-modal-card">
        <div class="admin-modal-header">
          <h3 id="confirmModalTitle">Confirm</h3>
          <button class="btn-close-modal" id="btnCancelConfirmX" aria-label="Close modal"><svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="admin-modal-body">
          <p id="confirmModalMessage">Are you sure?</p>
        </div>
        <div class="admin-modal-footer">
          <button class="btn-secondary" id="btnConfirmCancel">Cancel</button>
          <button class="btn-danger" id="btnConfirmAction">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }

  const titleElem = document.getElementById('confirmModalTitle');
  const msgElem = document.getElementById('confirmModalMessage');
  const confirmBtn = document.getElementById('btnConfirmAction');
  const cancelBtn = document.getElementById('btnConfirmCancel');
  const closeXBtn = document.getElementById('btnCancelConfirmX');

  if (titleElem) titleElem.textContent = title;
  if (msgElem) msgElem.textContent = message;
  if (confirmBtn) confirmBtn.textContent = confirmText;
  if (cancelBtn) cancelBtn.textContent = cancelText;

  modalOverlay.style.display = 'flex';

  const cleanup = () => {
    modalOverlay.style.display = 'none';
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;
    closeXBtn.onclick = null;
  };

  confirmBtn.onclick = () => {
    cleanup();
    if (typeof onConfirm === 'function') onConfirm();
  };

  cancelBtn.onclick = cleanup;
  closeXBtn.onclick = cleanup;
}
