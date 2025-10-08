import {Component, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-todo',
  imports: [FormsModule],
  templateUrl: './todo.html',
  styleUrl: './todo.css'
})

export class Todo implements OnInit {
  taskList = signal<Task[]>([]);
  filteredTaskList = signal<Task[]>([]);
  isFilteredData = signal<Boolean>(true);
  taskName: string = '';
  selectedTasks = signal<Set<number>>(new Set());

  ngOnInit() {
    const localData = localStorage.getItem('taskName');

    if (localData != null) {
      const parsedData: Task[] = JSON.parse(localData);
      // Ensure proper typing for loaded data
      const typedData = parsedData.map(task => ({
        ...task,
        taskStatus: task.taskStatus as 'New' | 'On Hold' | 'Completed',
        id: task.id || Date.now() + Math.random(), // fallback for old data
        isCompleted: task.isCompleted || task.taskStatus === 'Completed'
      }));
      this.taskList.set(typedData);
      this.filteredTaskList.set(typedData);
    }
  }

  addTask() {
    if (!this.taskName.trim()) return; // prevent empty tasks

    const taskObject: Task = {
      taskStatus: "New",
      taskName: this.taskName,
      id: Date.now(), // unique identifier
      isCompleted: false
    };

    this.taskList.update(oldList => ([...oldList, taskObject]));
    this.filteredTaskList.set(this.taskList());
    this.saveToLocalStorage();
    this.taskName = '';
  }

  deleteTask(index: number) {
    const taskToDelete = this.filteredTaskList()[index];
    const originalIndex = this.taskList().findIndex(t => t.id === taskToDelete.id);

    if (originalIndex !== -1) {
      this.taskList.update(oldList => oldList.filter((_, i) => i !== originalIndex));
      this.applyCurrentFilter();
      this.saveToLocalStorage();
    }
  }

  completeTask(index: number) {
    const taskToComplete = this.filteredTaskList()[index];
    const originalIndex = this.taskList().findIndex(t => t.id === taskToComplete.id);

    if (originalIndex !== -1) {
      this.taskList.update(oldList => {
        const newList = [...oldList];
        newList[originalIndex] = {
          ...newList[originalIndex],
          taskStatus: 'Completed',
          isCompleted: true
        };
        return newList;
      });
      this.applyCurrentFilter();
      this.saveToLocalStorage();
    }
  }

  toggleTaskSelection(index: number, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const taskToToggle = this.filteredTaskList()[index];
    const originalIndex = this.taskList().findIndex(t => t.id === taskToToggle.id);

    this.selectedTasks.update(selected => {
      const newSet = new Set(selected);
      if (checkbox.checked) {
        newSet.add(originalIndex);
      } else {
        newSet.delete(originalIndex);
      }
      return newSet;
    });
  }

  isTaskSelected(index: number): boolean {
    const task = this.filteredTaskList()[index];
    const originalIndex = this.taskList().findIndex(t => t.id === task.id);
    return this.selectedTasks().has(originalIndex);
  }

  changeStatus() {
    if (this.selectedTasks().size === 0) {
      alert('Please select at least one task to change status');
      return;
    }

    // Cycle through statuses: New -> On Hold -> Completed -> New
    const statusOrder: Array<'New' | 'On Hold' | 'Completed'> = ['New', 'On Hold', 'Completed'];

    this.taskList.update(oldList => {
      const newList = [...oldList];
      this.selectedTasks().forEach(index => {
        const currentStatus = newList[index].taskStatus;
        const currentIndex = statusOrder.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statusOrder.length;

        newList[index] = {
          ...newList[index],
          taskStatus: statusOrder[nextIndex],
          isCompleted: statusOrder[nextIndex] === 'Completed'
        };
      });
      return newList;
    });

    this.selectedTasks.set(new Set()); // Clear selections
    this.applyCurrentFilter();
    this.saveToLocalStorage();
  }

  textChange() {
    if (!this.taskName.trim()) {
      this.isFilteredData.set(true);
      this.filteredTaskList.set(this.taskList());
      return;
    }

    const filterData = this.taskList().filter(m =>
      m.taskName.toLowerCase().includes(this.taskName.toLowerCase())
    );

    if (filterData.length !== 0) {
      this.isFilteredData.set(true);
      this.filteredTaskList.set(filterData);
    } else {
      this.isFilteredData.set(false);
    }
  }

  onSelectFilter(event: any) {
    const selected = event.target.value;
    this.applyFilter(selected);
  }

  private applyFilter(filterType: string) {
    if (filterType === 'All') {
      this.isFilteredData.set(true);
      this.filteredTaskList.set(this.taskList());
    } else {
      const filterData = this.taskList().filter(m =>
        m.taskStatus.toLowerCase() === filterType.toLowerCase()
      );

      if (filterData.length !== 0) {
        this.isFilteredData.set(true);
        this.filteredTaskList.set(filterData);
      } else {
        this.isFilteredData.set(false);
      }
    }
  }

  private applyCurrentFilter() {
    // Reapply the last filter to update the view
    const filterData = this.taskList();
    this.filteredTaskList.set(filterData);
  }

  private saveToLocalStorage() {
    localStorage.setItem('taskName', JSON.stringify(this.taskList()));
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'On Hold':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Completed':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'New':
        return 'M12 4v16m8-8H4'; // Plus icon
      case 'On Hold':
        return 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'; // Clock icon
      case 'Completed':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // Check icon
      default:
        return '';
    }
  }
}

// Update Task interface
interface Task {
  id: number;
  taskName: string;
  taskStatus: 'New' | 'On Hold' | 'Completed';
  isCompleted: boolean;
}
