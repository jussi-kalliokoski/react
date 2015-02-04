/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks static-only
 * @providesModule ReactServerRendering
 */
'use strict';

var ReactElement = require('ReactElement');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactMarkupChecksum = require('ReactMarkupChecksum');
var ReactServerRenderingTransaction =
  require('ReactServerRenderingTransaction');

var emptyObject = require('emptyObject');
var instantiateReactComponent = require('instantiateReactComponent');
var invariant = require('invariant');

/**
 * @param {ReactElement} element
 * @return {string} the HTML markup
 */
function renderToString(element, writeFn) {
  invariant(
    ReactElement.isValidElement(element),
    'renderToString(): You must pass a valid ReactElement.'
  );

  var markup = '';

  writeFn = writeFn || function (string) {
      markup += string;
  };

  var transaction;
  try {
    var id = ReactInstanceHandles.createReactRootID();
    transaction = ReactServerRenderingTransaction.getPooled(false);
    transaction.write = writeFn;

    return transaction.perform(function() {
      var componentInstance = instantiateReactComponent(element, null);
      componentInstance.mountComponent(id, transaction, emptyObject);
      return ReactMarkupChecksum.addChecksumToMarkup(markup);
    }, null);
  } finally {
    ReactServerRenderingTransaction.release(transaction);
  }
}

/**
 * @param {ReactElement} element
 * @return {string} the HTML markup, without the extra React ID and checksum
 * (for generating static pages)
 */
function renderToStaticMarkup(element, writeFn) {
  invariant(
    ReactElement.isValidElement(element),
    'renderToStaticMarkup(): You must pass a valid ReactElement.'
  );

  var markup = '';

  writeFn = writeFn || function (string) {
      markup += string;
  };

  var transaction;
  try {
    var id = ReactInstanceHandles.createReactRootID();
    transaction = ReactServerRenderingTransaction.getPooled(true, writeFn);
    transaction.write = writeFn;

    return transaction.perform(function() {
      var componentInstance = instantiateReactComponent(element, null);
      componentInstance.mountComponent(id, transaction, emptyObject);
      return markup;
    }, null);
  } finally {
    ReactServerRenderingTransaction.release(transaction);
  }
}

module.exports = {
  renderToString: renderToString,
  renderToStaticMarkup: renderToStaticMarkup
};
