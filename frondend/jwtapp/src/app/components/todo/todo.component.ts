import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Emitters } from 'src/app/emitters/emitters';

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  todos: any[] = [];
  newTask: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('http://localhost:5000/api/user', {
      withCredentials: true
    }).subscribe(
      (res: any) => {
        Emitters.authEmitter.emit(true);
        this.fetchTodos();
      },
      (err) => {
        Emitters.authEmitter.emit(false);
      }
    );
  }

  fetchTodos() {
    this.http.get('http://localhost:5000/api/todos', {
      withCredentials: true
    }).subscribe(
      (res: any) => {
        this.todos = res;
      },
      (err) => {
        console.error(err);
      }
    );
  }

  addTodo() {
    if (this.newTask.trim()) {
      this.http.post('http://localhost:5000/api/todos', { task: this.newTask }, {
        withCredentials: true
      }).subscribe(
        (res: any) => {
          this.todos.push(res);
          this.newTask = '';
        },
        (err) => {
          console.error(err);
        }
      );
    }
  }

  toggleTodo(todo: any) {
    this.http.put(`http://localhost:5000/api/todos/${todo._id}`, { completed: !todo.completed }, {
      withCredentials: true
    }).subscribe(
      (res: any) => {
        todo.completed = res.completed;
      },
      (err) => {
        console.error(err);
      }
    );
  }

  deleteTodo(id: string) {
    this.http.delete(`http://localhost:5000/api/todos/${id}`, {
      withCredentials: true
    }).subscribe(
      (res: any) => {
        this.todos = this.todos.filter(t => t._id !== id);
      },
      (err) => {
        console.error(err);
      }
    );
  }
}
