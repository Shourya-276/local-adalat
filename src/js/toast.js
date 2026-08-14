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
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close-btn" aria-label="Close notification">✕</button>
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
          <button class="btn-close-modal" id="btnCancelConfirmX">✕</button>
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
  document.body.classList.add('modal-open');

  const cleanup = () => {
    modalOverlay.style.display = 'none';
    document.body.classList.remove('modal-open');
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
