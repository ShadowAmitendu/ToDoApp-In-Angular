import {Component, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Todo} from './components/todo/todo';

@Component({
  selector: 'app-root',
  imports: [CommonModule, Todo],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Todo App');
}
