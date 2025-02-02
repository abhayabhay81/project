import { useState } from "react"
import { v4 as uuidv4 } from "uuid"  // npm install uuid

export default function Todo() {

    const [todos, setTodos] = useState([{ task: " sample task", id: uuidv4() }])
    const [newtodo, setNewtodo] = useState(" ")

    let addnewlist = () => {
        // setTodos([...todos ,{task : newtodo, id : uuidv4()}])
        // setNewtodo(" ")

        // or

        setTodos((prevtodo) => {
            return [...prevtodo, { task: newtodo, id: uuidv4() }]  // add
        })
        setNewtodo(" ")
    }

    let updatetovalue = (event) => {
        setNewtodo(event.target.value)
    }

    let deletelist = (id) => {
        setTodos(todos.filter((todo) => todo.id != id)) // delete
    }

    let uppercaseall = () => {
        setTodos((todos) =>
            todos.map((todo) => {
                return {
                    ...todo,
                    task: todo.task.toUpperCase()
                }
            })
        )
    }

    let uppercaseone = (id) =>{
        setTodos((todos) =>
            todos.map((todo) => {
                if(todo.id == id){
                    return {
                        ...todo,
                        task: todo.task.toUpperCase()
                    }   
                }
                else{
                    return todo
                }
            })
        )
    }

    return (
        <div>
            <input
                type="text"
                placeholder="add a text"
                value={newtodo}
                onChange={updatetovalue} />
            <button onClick={addnewlist}>add item </button><hr />

            <h4>Todo list</h4>
            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}><span>{todo.task}</span>
                        &nbsp;&nbsp;&nbsp;
                        <button onClick={() => deletelist(todo.id)}>delete</button>
                        <button onClick={() => uppercaseone(todo.id)}>uppercase one</button>
                    </li>
                ))}
            </ul>
            <br />
            <button onClick={uppercaseall}>upper case</button>
        </div>
    )
}