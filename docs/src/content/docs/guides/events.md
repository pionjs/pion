---
title: Dispatching Events
---

There are a few steps you have to take in order to dispatch an event from your custom element:

1. Use the function syntax to define your component. This will give you access to `this`, the instance of your custom element.
2. When defining your callback that you wish to dispatch from, make sure it is bound to `this`. You can do this by using the fat arrow syntax.
3. Finally, you can create a `new CustomEvent` and pass that to `this.dispatchEvent`.

Here are a couple of examples of dispatching events from a pion custom element:

```js
function Product({ name, price, productId }) {
  const buyProduct = () => {
    const event = new CustomEvent('buy-product', {
      bubbles: true, // this let's the event bubble up through the DOM
      composed: true, // this let's the event cross the Shadow DOM boundary
      detail: { name, price, productId } // all data you wish to pass must be in `detail`
    });
    this.dispatchEvent(event);
  }

  return html`
    <article>
      <h3>${name}</h3>
      <p>Price: ${price} USD</p>
      <button @click=${buyProduct}>Purchase</button>
    </article>
  `;
}

Product.observedAttributes = ['name', 'price', 'product-id'];
```

With this, you can now listen for the `buy-product` event either on an instance of `<store-product>` itself or higher up in the DOM. Here are examples of both of these instances:

### Listening on an element

```js
function Store() {
  const [{ name }, setPurchased] = useState({});

  return html`
    <store-product
      name="T-Shirt"
      price="10.00"
      product-id="0001"
      @buy-product=${event => setPurchased(event.detail)}
    ></store-product>

    <p ?hidden=${!name}><output>${name} Purchased</output></p>
  `;
}
```

### Listening higher up in the DOM

```js
import { component, html, useEffect, useState } from '@pionjs/pion';
import './my-store.js';

function App(element) {
  const [report, setReport] = useState('');
  useEffect(() => {
    // Because the event bubbled all the way up here,
    // we can listen directly on this web component itself!
    const onBuyProduct = ({ detail: { productId }}) =>
      setReport(`product id ${productId} ordered`);

    element.addEventListener('buy-product', onBuyProduct);

    // very important to remove the event listener!
    return () =>
      element.removeEventListener('buy-product', onBuyProduct);
  }, []); // make sure you list all dependencies

  return html`
    <my-store></my-store>
    <p><output>${report}</output></p>
  `;
}

customElements.define('my-app', component(App));
```

If you want to look more into firing events, here are some links:

* [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) -- MDN
* [`Event`](https://developer.mozilla.org/en-US/docs/Web/API/Event) -- MDN
* [`dispatchEvent`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent) -- MDN
* [Creating and triggering events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events) -- MDN
* ["Shadow DOM and Events"](https://javascript.info/shadow-dom-events) -- Ilya Kantor
