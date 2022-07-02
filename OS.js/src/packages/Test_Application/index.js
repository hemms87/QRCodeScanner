import './index.scss';
import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import React from 'react';
import ReactDom from 'react-dom';
import App from './src/App'
// Our launcher
const register = (core, args, options, metadata) => {
  // Create a new Application instance
  const proc = core.make('osjs/application', {args, options, metadata});
  proc.createWindow({
    id: 'QRCodeViewer',
    title: 'Lab 7',
    icon: proc.resource(proc.metadata.icon),
    dimension: {width: 400, height: 400},
    position: {left: 700, top: 200}
  })
  .on('destroy', () => proc.destroy())
  .render($content => ReactDom.render(React.createElement(App), $content)); 

  console.log('Processs creator: ', proc);
  return proc;
};

// Creates the internal callback function when OS.js launches an application
osjs.register(applicationName, register);
