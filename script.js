document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
});

(() => {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const uid = () => 't' + Date.now() + Math.floor(Math.random()*1000);

  const STORAGE_KEY = 'todo_app_tasks_v1';

  function loadTasks(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function saveTasks(tasks){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  const defaultTasks = [
    { id: uid(), title: 'Веб-программирование', desc: 'Сделать лабу №2. Разработать дизайн и логику системы', date:'2025-10-07', status:'inprogress', order:0 },
    { id: uid(), title: 'Английский язык', desc: 'Сделать дз, написать райтинг', date:'2025-10-05', status:'pending', order:1 },
    { id: uid(), title: 'Английский язык', desc: 'Сделать дз, написать райтинг', date:'2025-10-05', status:'done', order:2 }
  ];

  let tasks = loadTasks();
  if(!tasks || tasks.length === 0){
    tasks = defaultTasks;
    saveTasks(tasks);
  }
  let filterMode = 'all'; // 'all' | 'done' | 'undone'
  let searchQuery = '';
  let sortAsc = false;

  function createHeader(){
    const header = document.createElement('header');
    header.className = 'header';

    const left = document.createElement('div');
    const logo = document.createElement('a');
    logo.href = '#';
    const img = document.createElement('img');
    img.src = 'img/to-do-logo.svg';
    img.alt = 'Logo';
    img.className = 'logo-img';
    logo.appendChild(img);
    left.appendChild(logo);

    const right = document.createElement('div');
    right.className = 'switch-lang';
    const rus = document.createElement('span'); rus.className='lang-name'; rus.textContent='Рус';
    const wrapper = document.createElement('div'); wrapper.className='header-lang';
    const label = document.createElement('label'); label.className='switch';
    const input = document.createElement('input'); input.type='checkbox'; input.className='lang-switch';
    const span = document.createElement('span'); span.className='slider round';
    label.appendChild(input); label.appendChild(span);
    wrapper.appendChild(label);
    const eng = document.createElement('span'); eng.className='lang-name'; eng.textContent='Eng';
    right.append(rus, wrapper, eng);

    header.append(left, right);
    document.body.prepend(header);
  }

  function createMain(){
    const main = document.createElement('main');
    main.className = 'todo-container';
    const title = document.createElement('h1');
    title.className = 'todo-title';
    title.textContent = 'Список задач';
    main.appendChild(title);

    const controls = document.createElement('div');
    controls.className = 'todo-controls';

    const filterWrapper = document.createElement('div');
    filterWrapper.className = 'filter-buttons';
    const btnAll = document.createElement('button'); btnAll.className='filter-btn active filter-all'; btnAll.textContent='Все'; btnAll.dataset.mode='all';
    const btnDone = document.createElement('button'); btnDone.className='filter-btn filter-completed'; btnDone.textContent='Выполненные'; btnDone.dataset.mode='done';
    const btnUndone = document.createElement('button'); btnUndone.className='filter-btn filter-not-completed'; btnUndone.textContent='Невыполненные'; btnUndone.dataset.mode='undone';
    filterWrapper.append(btnAll, btnDone, btnUndone);

    const actions = document.createElement('div'); actions.className='todo-actions';

    const searchBox = document.createElement('div'); searchBox.className='search-box';
    const searchInput = document.createElement('input'); searchInput.className='search-input-cl'; searchInput.type='text'; searchInput.placeholder='Искать задачи...';
    searchInput.id = 'searchInput';
    const searchIcon = document.createElement('img'); searchIcon.src='img/search-icon.svg'; searchIcon.alt='search'; searchIcon.className='search-icon';
    searchBox.append(searchInput, searchIcon);

    const sortBtn = document.createElement('button'); sortBtn.className='sort-btn sort-btn-cl'; sortBtn.title='Сортировать по дате';
    const sortText = document.createTextNode('Сортировка');
    const sortIcon = document.createElement('img'); sortIcon.src='img/filter-icon.svg'; sortIcon.alt='sort'; sortIcon.className='sort-icon';
    sortBtn.append(sortText, sortIcon);

    const addBtn = document.createElement('button'); addBtn.className='add-task-btn'; addBtn.textContent='Добавить задачу';
    actions.append(searchBox, sortBtn, addBtn);

    controls.append(filterWrapper, actions);

    const listCard = document.createElement('div'); listCard.className = 'task-list-card';
    const emptyState = document.createElement('div'); emptyState.className='empty-state'; emptyState.id='emptyState';
    emptyState.textContent = 'Список задач пуст. Нажмите "Добавить задачу" чтобы создать первую задачу.';
    const tasksTable = document.createElement('table'); tasksTable.className='tasks-table'; tasksTable.id='tasksTable';
    // header
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['','Название','Описание','Статус','Дата',''].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    tasksTable.appendChild(thead);
    const tbody = document.createElement('tbody');
    tasksTable.appendChild(tbody);

    listCard.append(emptyState, tasksTable);
    main.append(controls, listCard);
    document.body.appendChild(main);

    
    filterWrapper.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if(!btn) return;
      qsa('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      filterMode = btn.dataset.mode;
      renderTasks();
    });

    searchInput.addEventListener('input', (e)=> {
      searchQuery = e.target.value.trim().toLowerCase();
      renderTasks();
    });

    sortBtn.addEventListener('click', ()=> {
      sortAsc = !sortAsc;
      renderTasks();
      sortBtn.style.opacity = 0.8;
      setTimeout(()=>sortBtn.style.opacity = 1,120);
    });

    addBtn.addEventListener('click', ()=> openModal());

    return { main, tbody, tasksTable, emptyState };
  }

  function renderTasks(){
    const { tbody, tasksTable, emptyState } = dom;
    let visible = tasks.slice().sort((a,b)=> (a.order - b.order));
    if(searchQuery){
      visible = visible.filter(t => t.title.toLowerCase().includes(searchQuery));
    }
    if(filterMode === 'done') visible = visible.filter(t => t.status === 'done');
    if(filterMode === 'undone') visible = visible.filter(t => t.status !== 'done');

    if(sortAsc){
      visible.sort((a,b) => new Date(a.date) - new Date(b.date));
    } else {
      visible.sort((a,b) => a.order - b.order);
    }

    if(visible.length === 0){
      tasksTable.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    } else {
      tasksTable.style.display = '';
      emptyState.style.display = 'none';
    }

    tbody.innerHTML = '';
    visible.forEach(task => {
      const tr = document.createElement('tr');
      tr.draggable = true;
      tr.dataset.id = task.id;
      if(task.status === 'done') tr.classList.add('completed');

      const tdChk = document.createElement('td'); tdChk.className='task-checkbox';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = (task.status === 'done');
      cb.addEventListener('change', () => {
        task.status = cb.checked ? 'done' : 'pending';
        saveTasks(tasks); renderTasks();
      });
      tdChk.appendChild(cb);

      const tdTitle = document.createElement('td');
      const titleDiv = document.createElement('div'); titleDiv.className='task-title'; titleDiv.textContent = task.title;
      const descSmall = document.createElement('div'); descSmall.className='task-desc'; descSmall.textContent = task.desc;
      tdTitle.append(titleDiv, descSmall);

      const tdDesc = document.createElement('td'); tdDesc.textContent = ''; // we already show desc below title; keep column for layout

      const tdStatus = document.createElement('td');
      const dot = document.createElement('span'); dot.className='status-dot';
      if(task.status === 'done') dot.classList.add('done');
      else if(task.status === 'inprogress') dot.classList.add('inprogress');
      else dot.classList.add('pending');
      tdStatus.appendChild(dot);

      const tdDate = document.createElement('td');
      // format date to dd.mm.yy
      const dt = new Date(task.date);
      const format = (d)=> String(d).padStart(2,'0');
      const out = dt instanceof Date && !isNaN(dt) ? `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getFullYear()).slice(-2)}` : task.date;
      tdDate.textContent = out;

      const tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';
      const actionsWrapper = document.createElement('div'); actionsWrapper.className='row-actions';
      const editBtn = document.createElement('button'); editBtn.className='action-btn'; editBtn.title='Редактировать'; editBtn.innerHTML='✎';
      editBtn.addEventListener('click', ()=> openModal(task));
      const delBtn = document.createElement('button'); delBtn.className='action-btn'; delBtn.title='Удалить'; delBtn.innerHTML='🗑';
      delBtn.addEventListener('click', ()=> {
        if(confirm('Удалить задачу?')) {
          tasks = tasks.filter(t => t.id !== task.id);
          // reindex order
          tasks.forEach((t,i)=>t.order = i);
          saveTasks(tasks);
          renderTasks();
        }
      });
      const dragHandle = document.createElement('span'); dragHandle.className='drag-handle'; dragHandle.textContent='⋮';
      actionsWrapper.append(dragHandle, editBtn, delBtn);
      tdActions.appendChild(actionsWrapper);

      tr.append(tdChk, tdTitle, tdDesc, tdStatus, tdDate, tdActions);
      tbody.appendChild(tr);

      tr.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        tr.classList.add('dragging');
      });
      tr.addEventListener('dragend', () => {
        tr.classList.remove('dragging');
      });
      tr.addEventListener('dragover', (e) => {
        e.preventDefault();
        const after = getDragAfterElement(tbody, e.clientY);
        const dragging = tbody.querySelector('.dragging');
        if(after == null) tbody.appendChild(dragging);
        else tbody.insertBefore(dragging, after);
      });
      tr.addEventListener('drop', (e) => {
        e.preventDefault();
        const ids = Array.from(tbody.querySelectorAll('tr')).map(r => r.dataset.id);
        tasks.sort((a,b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        tasks.forEach((t,i)=>t.order=i);
        saveTasks(tasks);
        renderTasks();
      });

    });
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  let domModal = null;
  function openModal(task = null){
    // build overlay + form
    if(domModal) return; // single modal
    const overlay = document.createElement('div'); overlay.className='modal-overlay';
    const card = document.createElement('div'); card.className='modal-card';
    overlay.appendChild(card);

    const titleRow = document.createElement('div'); titleRow.className='form-row';
    const titleLabel = document.createElement('label'); titleLabel.className='form-label form-label-cl'; titleLabel.textContent='Название';
    const titleInput = document.createElement('input'); titleInput.className='input'; titleInput.type='text';
    titleRow.append(titleLabel, titleInput);

    const descRow = document.createElement('div'); descRow.className='form-row';
    const descLabel = document.createElement('label'); descLabel.className='form-label form-label-about'; descLabel.textContent='Описание';
    const descInput = document.createElement('textarea'); descInput.className='textarea';
    descRow.append(descLabel, descInput);

    const bottom = document.createElement('div'); bottom.style.display='flex'; bottom.style.justifyContent='space-between'; bottom.style.alignItems='center';

    const leftGroup = document.createElement('div'); leftGroup.style.display='flex'; leftGroup.style.alignItems='center'; leftGroup.style.gap='18px';
    const statusCol = document.createElement('div');
    const statusLabel = document.createElement('div'); statusLabel.className='form-label form-label-status'; statusLabel.textContent='Статус';
    const statusSelector = document.createElement('div'); statusSelector.className='status-selector';
    const sPending = document.createElement('div'); sPending.className='status-dot-selector'; sPending.dataset.val='pending'; sPending.style.background='#E6D96A';
    const sInprogress = document.createElement('div'); sInprogress.className='status-dot-selector'; sInprogress.dataset.val='inprogress'; sInprogress.style.background='#B9E6A6';
    const sDone = document.createElement('div'); sDone.className='status-dot-selector'; sDone.dataset.val='done'; sDone.style.background='#E6A6A6';
    [sInprogress, sPending, sDone].forEach(s=>statusSelector.appendChild(s)); // arrange visually pleasing
    statusCol.append(statusLabel, statusSelector);
    leftGroup.append(statusCol);

    // date
    const dateCol = document.createElement('div');
    const dateLabel = document.createElement('div'); dateLabel.className='form-label form-label-date'; dateLabel.textContent='Дата';
    const dateInput = document.createElement('input'); dateInput.type='date'; dateInput.className='date-input';
    // default date today
    const today = new Date().toISOString().slice(0,10);
    dateInput.value = today;
    dateCol.append(dateLabel, dateInput);
    leftGroup.append(dateCol);

    bottom.append(leftGroup);

    // actions
    const actionsCol = document.createElement('div'); actionsCol.className='modal-actions';
    const addBtn = document.createElement('button'); addBtn.className='modal-primary modal-primary-save'; addBtn.textContent = task ? 'Сохранить' : 'Добавить задачу';
    const cancelBtn = document.createElement('button'); cancelBtn.className='modal-cancel'; cancelBtn.textContent='Отменить';
    actionsCol.append(cancelBtn);
    bottom.append(actionsCol);

    // prefill if edit
    if(task){
      titleInput.value = task.title;
      descInput.value = task.desc;
      dateInput.value = task.date;
      // select dot
      [sPending, sInprogress, sDone].forEach(s=>s.classList.remove('selected'));
      if(task.status === 'done') sDone.classList.add('selected');
      else if(task.status === 'inprogress') sInprogress.classList.add('selected');
      else sPending.classList.add('selected');
    } else {
      sInprogress.classList.add('selected'); // default selected
    }

    // select status click
    [sPending, sInprogress, sDone].forEach(s => {
      s.addEventListener('click', () => {
        [sPending, sInprogress, sDone].forEach(x=>x.classList.remove('selected'));
        s.classList.add('selected');
      });
    });

    // append nodes
    card.append(titleRow, descRow, bottom);
    // place add and cancel in footer visually
    const footer = document.createElement('div'); footer.style.marginTop='12px'; footer.style.display='flex'; footer.style.justifyContent='space-between'; footer.style.alignItems='center';
    const leftFooter = document.createElement('div');
    leftFooter.appendChild(addBtn);
    const rightFooter = document.createElement('div'); rightFooter.appendChild(cancelBtn);
    footer.append(leftFooter, rightFooter);
    card.append(footer);

   
    document.body.appendChild(overlay);
    domModal = overlay;
    document.querySelector('.todo-container').classList.add('blur-me');

    // cancel
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });

    addBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const desc = descInput.value.trim();
      const date = dateInput.value || today;
      const statusEl = document.querySelector('.status-dot-selector.selected');
      const statusVal = statusEl ? statusEl.dataset.val : 'pending';
      if(!title){
        alert('Введите название задачи');
        return;
      }
      if(task){
        // edit
        task.title = title; task.desc = desc; task.date = date; task.status = statusVal;
      } else {
        // new
        const newTask = { id: uid(), title, desc, date, status: statusVal, order: tasks.length };
        tasks.push(newTask);
      }
      saveTasks(tasks);
      closeModal();
      renderTasks();
    });
  }

  function closeModal(){
    if(!domModal) return;
    domModal.remove();
    domModal = null;
    document.querySelector('.todo-container').classList.remove('blur-me');
  }

  const dom = createMain();
  createHeader();
  renderTasks();

  dom.tbody.addEventListener('dragover', (e)=> e.preventDefault());
})();


