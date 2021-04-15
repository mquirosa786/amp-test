import React, {useState, useEffect} from 'react'
import logo from './logo.svg';
import './App.css';
import * as mutations from './graphql/mutations';
import * as queries from './graphql/queries';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import {Auth, Hub, Logger, API} from 'aws-amplify'

const initialFormState = {
  username: '',
  password: '',
  email: '',
  authCode: '',
  family_name: '',
  name: '',
  formType: 'signUp'
}

function App() {
  const[formState, updateFormState] = useState(initialFormState)
  const [user, updateUser] = useState(null)
  const [book, setBook] = useState('')
  const [userName, setUserName] = useState('')
  const [listOfBooks, setListOfBooks] = useState([])

  useEffect(() => {
    checkUser()
    setAuthListener()

    async function getAllBooks(){
      const allBooks = await API.graphql({query: queries.listBooks})
      setListOfBooks(allBooks.data.listBooks.items)
      console.log("All Books -> ",allBooks.data)
    }

    Auth.currentAuthenticatedUser().then(user => {
      setUserName(user.attributes.name)
    })

    getAllBooks();

  },[])
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const bookDetails = {
      name: book,
      description: "description of "+book,
      author: userName,
      year: 2021,
      testField1: "Esto es prueba de "+book
    }

    const newBook = await API.graphql({query: mutations.createBook, variables: {input: bookDetails}})

  }
  async function setAuthListener(){
    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
          case 'signOut':
              updateFormState(() => ({...formState, formType : 'signIn'})) 
              break;
          default:
            break;
      }
    })  
  }
  async function checkUser(){
    try{
      const user = await Auth.currentAuthenticatedUser()
      console.log(user)
      updateUser(user)
      updateFormState(() => ({...formState, formType : 'signedIn'})) 
    }catch(error){
    }
  }
  function onChange(e){
    e.persist()
    updateFormState(() => ({...formState, [e.target.name] : e.target.value}))
  }
  const{formType} = formState
  async function signUp(){
    const {username, email, password, name, family_name} = formState
    console.log(formState)
    await Auth.signUp(
      {
        username, 
        password, 
        attributes: {
          email,
          name,
          family_name
        }
      });
    updateFormState(() => ({...formState, formType : 'confirmSignUp'}))
  }
  async function confirmSignUp(){
    const {username, authCode} = formState
    console.log("confirmSignUp -> ")
    console.log(formState)
    await Auth.confirmSignUp(username,authCode);
    updateFormState(() => ({...formState, formType : 'signIn'}))     
  }
  async function signIn(){
    const {username, password} = formState
    await Auth.signIn(
      {
        username, 
        password
      });
    updateFormState(() => ({...formState, formType : 'signedIn'}))     
  }
  return (
    <div className="App">
        {
          formType === 'signUp' && (
            <div>
              <input name="username" onChange={onChange} placeholder="username"/>
              <input name="name" onChange={onChange} placeholder="Name"/>
              <input name="family_name" onChange={onChange} placeholder="Family Name"/>
              <input name="password" type="password" onChange={onChange} placeholder="password"/>
              <input name="email" onChange={onChange} placeholder="email"/>
              <button onClick={signUp}>Sign Up</button>
              <button onClick={() => updateFormState(() => ({
                ...formState, formType : 'signIn'
              }))}>Sign In</button>
            </div>
          )
        }
        {
          formType === 'confirmSignUp' && (
            <div>
              <input name="authCode" onChange={onChange} placeholder="Confirmation code"/>
              <button onClick={confirmSignUp}>Confirm Sign Up</button>
            </div>
          )
        }
        {
          formType === 'signIn' && (
            <div>
              <input name="username" onChange={onChange} placeholder="username"/>
              <input name="password" type="password" onChange={onChange} placeholder="password"/>
              <button onClick={signIn}>Sign In</button>
              <button onClick={() => updateFormState(() => ({
                ...formState, formType : 'signUp'
              }))}>Sign Up</button>
            </div>
          )
        }
        {
          formType === 'signedIn' && (
            <div>
              <h1>Hello world, welcome {userName}!</h1>
              <button onClick={
                () => Auth.signOut()
                }>Sign out</button>
                <br></br>
                <br></br>
                <form onSubmit={handleFormSubmit}>
                  <input placeholder="Enter a book" type="text" name="book" id="book" onChange={e=>setBook(e.target.value)}/>
                  <button type="submit">Submit</button>
                </form>
                <p>Book: {book}</p>
                <h2>List of books:</h2>
                {listOfBooks && listOfBooks.map(item => 
                  <li key={item.id}>
                    {item.name}
                  </li>)}
            </div>
          )
        }
    </div>
  );
}

export default App;
