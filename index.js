const id = {};

export function compose(...components) {
  if (components.length === 0) {
    return id;
  } else {
    let [left, ...cs] = components;
    let right = compose(...cs);

    let leftKeys = Object.keys(left);
    let rightKeys = Object.keys(right);
    let result = {};
    rightKeys.forEach(k => result[k] = right[k]);
    leftKeys.forEach(k => {
      if (!result.hasOwnProperty(k)) {
        result[k] = left[k];
      } else {
        result[k] = function(next, ...args) {
          return left[k].call(this, (...args) => right[k].call(this, next, ...args), ...args);
        }
      }
    });
    return result;
  }
}

function mapComponent(component, f) {
  let res = {};
  Object.keys(component).forEach(k => {
    res[k] = f(component[k]);
  });
  return res;
}

export function close(component) {
  return mapComponent(component, function(f) {
    return function(...args) {
      return f.apply(this, [Function.prototype, ...args]);
    }
  });
}

export function bind(component, o) {
  return mapComponent(component, function(f) {
    return function(...args) {
      return f.apply(o, [...args]);
    }
  });
}

export function when(property, component) {
  return mapComponent(component, function(f) {
    return function(next, ...args) {
      if (this[property]) {
        return f.apply(this, [next, ...args]);
      } else {
        return next(...args);
      }
    }
  });
}

export function whenNot(property, component) {
  return mapComponent(component, function(f, next, ...args) {
    return function(next, ...args) {
      if (!this[property]) {
        return f.apply(this, [next, ...args]);
      } else {
        return next(...args);
      }
    }
  });
}
