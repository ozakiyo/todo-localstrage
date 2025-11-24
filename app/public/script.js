<script>
const taskInput = document.getElementById("taskInput");
const descInput = document.getElementById("descInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const prioritySelector = document.getElementById("prioritySelector");
const dueDateInput = document.getElementById("dueDateInput");
const categorySelector = document.getElementById("categorySelector");
const newCategoryInput = document.getElementById("newCategoryInput");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const deleteCategorySelector = document.getElementById("deleteCategorySelector");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");
const searchInput = document.getElementById("searchInput");
const searchClearBtn = document.getElementById("searchClearBtn");
const filterStatus = document.getElementById("filterStatus");
const filterPriority = document.getElementById("filterPriority");
const filterCategory = document.getElementById("filterCategory");
const sortSelector = document.getElementById("sortSelector");

let data = [];
let categories = [];
let editId = null;
let currentView = "all";

//------------------ API呼び出し ------------------//

async function fetchTasks() {
  const res = await fetch("/api/tasks");
  data = await res.json();
  renderTasks();
}

async function fetchCategories() {
  const res = await fetch("/api/categories");
  const cats = await res.json();
  categories = cats.map(c => c.name);
  renderCategories();
}

async function addTask(task) {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });
  const result = await res.json();
  task.id = result.id;
  data.unshift(task);
  renderTasks();
}

async function updateTask(id, task) {
  await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });
  await fetchTasks();
}

async function deleteTaskAPI(id) {
  await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  await fetchTasks();
}

async function addCategoryAPI(name) {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  await fetchCategories();
}

async function deleteCategoryAPI(name) {
  await fetch(`/api/categories/${name}`, { method: "DELETE" });
  await fetchCategories();
  await fetchTasks(); // 削除したカテゴリがあればタスクも更新
}

//------------------ レンダリング ------------------//

function renderCategories() {
  categorySelector.innerHTML = "";
  filterCategory.innerHTML = '<option value="all">全カテゴリ</option>';
  deleteCategorySelector.innerHTML = "";
  categories.forEach(cat => {
    const opt1 = document.createElement("option");
    opt1.value = cat; opt1.textContent = cat; categorySelector.appendChild(opt1);
    const opt2 = document.createElement("option");
    opt2.value = cat; opt2.textContent = cat; filterCategory.appendChild(opt2);
    const opt3 = document.createElement("option");
    opt3.value = cat; opt3.textContent = cat; deleteCategorySelector.appendChild(opt3);
  });
  if(categories.length>0) categorySelector.value = categories[0];
}

function renderTasks() {
  taskList.innerHTML = "";
  const today = new Date().toISOString().slice(0,10);
  const keyword = searchInput.value.trim().toLowerCase();

  let sortedData = [...data];
  const sortType = sortSelector.value;
  if(sortType === "created") sortedData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  else if(sortType === "dueDate") sortedData.sort((a,b)=> (a.dueDate||"9999") < (b.dueDate||"9999") ? -1 : 1);
  else if(sortType==="priority"){ const order={high:1,medium:2,low:3}; sortedData.sort((a,b)=>order[a.priority]-order[b.priority]); }

  sortedData.forEach(task => {
    if(keyword && !task.text.toLowerCase().includes(keyword)) return;
    if(filterStatus.value==="completed" && !task.completed) return;
    if(filterStatus.value==="incomplete" && task.completed) return;
    if(filterPriority.value!=="all" && task.priority!==filterPriority.value) return;
    if(filterCategory.value!=="all" && task.category!==filterCategory.value) return;

    const li = document.createElement("li");
    if(task.completed) li.classList.add("completed");
    li.classList.add(task.priority);
    if(task.dueDate){
      if(task.dueDate<today) li.classList.add("overdue");
      else if(task.dueDate===today) li.classList.add("due-today");
    }

    const checkbox = document.createElement("input");
    checkbox.type="checkbox"; checkbox.checked = task.completed;
    checkbox.addEventListener("change",()=>toggleTask(task.id,checkbox.checked));

    const span = document.createElement("span"); span.textContent=task.text;

    const descSpan = document.createElement("div"); descSpan.textContent = task.description || "";
    const catSpan = document.createElement("span"); catSpan.textContent = task.category || "未分類";
    const dueSpan = document.createElement("span"); dueSpan.textContent = task.dueDate ? `期限：${task.dueDate}`:"";

    const buttonArea = document.createElement("div");
    const editBtn = document.createElement("button"); editBtn.textContent="編集";
    editBtn.addEventListener("click",()=>editTask(task));
    const delBtn = document.createElement("button"); delBtn.textContent="削除";
    delBtn.addEventListener("click",()=>deleteTaskAPI(task.id));

    buttonArea.appendChild(editBtn); buttonArea.appendChild(delBtn);

    const row = document.createElement("div"); row.appendChild(checkbox); row.appendChild(span);
    li.appendChild(row);
    const infoRow = document.createElement("div"); infoRow.appendChild(descSpan); infoRow.appendChild(catSpan); infoRow.appendChild(dueSpan);
    li.appendChild(infoRow);
    li.appendChild(buttonArea);

    taskList.appendChild(li);
  });
}

//------------------ イベント ------------------//

addBtn.addEventListener("click",()=>{
  const task = {
    text: taskInput.value.trim(),
    description: descInput.value.trim(),
    priority: prioritySelector.value,
    dueDate: dueDateInput.value,
    category: categorySelector.value,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: null
  };
  if(!task.text) return;
  if(editId){
    updateTask(editId, task);
    editId = null;
  }else{
    addTask(task);
  }
  taskInput.value=""; descInput.value=""; dueDateInput.value="";
});

addCategoryBtn.addEventListener("click",()=>{
  const name = newCategoryInput.value.trim();
  if(!name || categories.includes(name)) return;
  addCategoryAPI(name);
  newCategoryInput.value="";
});

deleteCategoryBtn.addEventListener("click",()=>{
  const name = deleteCategorySelector.value;
  if(!name) return;
  if(name==="その他"){ alert("「その他」は削除できません"); return;}
  deleteCategoryAPI(name);
});

searchInput.addEventListener("input",renderTasks);
searchClearBtn.addEventListener("click",()=>{ searchInput.value=""; renderTasks(); });
filterStatus.addEventListener("change",renderTasks);
filterPriority.addEventListener("change",renderTasks);
filterCategory.addEventListener("change",renderTasks);
sortSelector.addEventListener("change",renderTasks);

function toggleTask(id,completed){
  const task = data.find(t=>t.id===id);
  if(task){
    task.completed = completed;
    updateTask(id, task);
  }
}

function editTask(task){
  editId = task.id;
  taskInput.value = task.text;
  descInput.value = task.description;
  dueDateInput.value = task.dueDate || "";
  prioritySelector.value = task.priority;
  categorySelector.value = task.category;
}

// 初期表示
fetchCategories();
fetchTasks();
</script>
