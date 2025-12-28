import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app.component';

export { mount, unmount } from './mount';

// Standalone mode: solo bootstrapea si el selector del Remote existe en el DOM.
const selectorExists = document.querySelector('app-bank-mfe');
if (selectorExists) {
  bootstrapApplication(AppComponent, {
    providers: [provideZonelessChangeDetection()],
  }).catch((err) => console.error(err));
}


