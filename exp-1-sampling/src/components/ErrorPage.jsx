import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

const ErrorPage = () => {
  const error = useRouteError();
  console.error(error);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
      <Link to="/" style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#1D2A6D',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px'
      }}>
        Go Back Home
      </Link>
    </div>
  );
};

export default ErrorPage;
