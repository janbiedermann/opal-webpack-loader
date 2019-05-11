// import here all npm modules that are common to browser and server side rendering (ssr) environments
// modules should not depend on the window or document objects of the browser
// use global to make sure they are available globally
//
// example:
//
// import * as Redux from 'redux';
// global.Redux = Redux;

// allow for hot reloading
if (module.hot) { module.hot.accept(); }
