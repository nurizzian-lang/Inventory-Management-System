const STORAGE_KEY = 'inventory-management-demo';

const initialItems = [
  { id: '1', name: 'Wireless Mouse', category: 'Electronics', quantity: 24, price: 19.99, supplier: 'Tech Supplies', reorder: 10 },
  { id: '2', name: 'Office Chair', category: 'Furniture', quantity: 7, price: 129.5, supplier: 'Workspace Co.', reorder: 5 },
  { id: '3', name: 'Notebook Pack', category: 'Stationery', quantity: 3, price: 4.5, supplier: 'Paper Goods', reorder: 8 }
];

const form = document.getElementById('item-form');
const inventoryList = document.getElementById('inventory-list');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const clearDataBtn = document.getElementById('clear-data');
const cancelEditBtn = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');

const itemIdInput = document.getElementById('item-id');
const nameInput = document.getElementById('name');
const categoryInput = document.getElementById('category');
const quantityInput = document.getElementById('quantity');
const priceInput = document.getElementById('price');
const supplierInput = document.getElementById('supplier');
const reorderInput = document.getElementById('reorder');

let items = loadItems();

function loadItems() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialItems;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : initialItems;
  } catch {
    return initialItems;
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getFilteredItems() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  return items.filter((item) => {
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.supplier.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
}

function getStatus(item) {
  if (item.quantity === 0) return { label: 'Out of Stock', className: 'out-of-stock' };
  if (item.quantity <= item.reorder) return { label: 'Low Stock', className: 'low-stock' };
  return { label: 'In Stock', className: 'in-stock' };
}

function renderSummary() {
  const totalItems = items.length;
  const lowStockItems = items.filter((item) => item.quantity <= item.reorder).length;
  const inventoryValue = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  document.getElementById('total-items').textContent = totalItems;
  document.getElementById('low-stock').textContent = lowStockItems;
  document.getElementById('inventory-value').textContent = `$${inventoryValue.toFixed(2)}`;
}

function renderCategories() {
  const categories = [...new Set(items.map((item) => item.category))];
  const currentValue = categoryFilter.value;
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  if (categories.includes(currentValue)) {
    categoryFilter.value = currentValue;
  } else {
    categoryFilter.value = 'all';
  }
}

function renderInventory() {
  const filteredItems = getFilteredItems();

  if (!filteredItems.length) {
    inventoryList.innerHTML = '<tr><td colspan="7">No matching items found.</td></tr>';
    return;
  }

  inventoryList.innerHTML = filteredItems
    .map((item) => {
      const status = getStatus(item);
      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${item.quantity}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td>${item.supplier}</td>
          <td><span class="status-pill ${status.className}">${status.label}</span></td>
          <td>
            <div class="actions">
              <button class="action-btn edit" data-action="edit" data-id="${item.id}">Edit</button>
              <button class="action-btn delete" data-action="delete" data-id="${item.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function render() {
  renderSummary();
  renderCategories();
  renderInventory();
}

function resetForm() {
  form.reset();
  itemIdInput.value = '';
  formTitle.textContent = 'Add Item';
  cancelEditBtn.classList.add('hidden');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    category: categoryInput.value.trim(),
    quantity: Number(quantityInput.value),
    price: Number(priceInput.value),
    supplier: supplierInput.value.trim(),
    reorder: Number(reorderInput.value)
  };

  if (!payload.name || !payload.category || !payload.supplier) {
    return;
  }

  if (itemIdInput.value) {
    items = items.map((item) => (item.id === itemIdInput.value ? { ...item, ...payload } : item));
  } else {
    items.unshift({ id: crypto.randomUUID(), ...payload });
  }

  saveItems();
  render();
  resetForm();
});

inventoryList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === 'delete') {
    items = items.filter((item) => item.id !== id);
    saveItems();
    render();
    return;
  }

  if (action === 'edit') {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    itemIdInput.value = item.id;
    nameInput.value = item.name;
    categoryInput.value = item.category;
    quantityInput.value = item.quantity;
    priceInput.value = item.price;
    supplierInput.value = item.supplier;
    reorderInput.value = item.reorder;
    formTitle.textContent = 'Edit Item';
    cancelEditBtn.classList.remove('hidden');
    nameInput.focus();
  }
});

searchInput.addEventListener('input', renderInventory);
categoryFilter.addEventListener('change', renderInventory);
cancelEditBtn.addEventListener('click', resetForm);
clearDataBtn.addEventListener('click', () => {
  items = initialItems;
  saveItems();
  render();
  resetForm();
});

render();
