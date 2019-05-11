// entry file for the server side rendering environment (ssr)
// import npm modules that are only valid to use in the server side rendering environment
// for example modules which depend on objects provided by node js
//
// example:
//
// import ReactDOMServer from 'react-dom/server';
// global.ReactDOMServer = ReactDOMServer;

// import modules common to browser and server side rendering (ssr)
// environments from application_common.js
import './application_common.js';

// import and load opal ruby files
import init_app from 'opal_loader.rb';
init_app();
Opal.load('opal_loader');

// allow for hot reloading
if (module.hot) { module.hot.accept(); }
