import assert from 'assert';
import { compose, close, bind, when, whenNot } from './index';

const c1 = {
  foo(next, f) {
    f('foo called')
  },

  bar(next, f) {
    f('bar called');
    next(f);
  }
};

const c2 = {
  foo(next, f) {
    f('foo2 called');
  },

  bar(next, f) {
    f('bar2 called');
    next();
  }
}

const a = {
  f(next) {
    this.x = 2;
    next();
  },
  g(next, x) {
    return next(x + 1);
  }
};

const b = {
  f(next) {
    this.x += 1;
    next();
  },
  g(next, x) {
    return next(x + 1);
  }
}

const c = {
  g(next, x) {
    return x + 1;
  }
}

function makeSink() {
  let values = [];
  return {
    f: x => values.push(x),
    values
  }
}

describe('compose', function() {
  it('is the identity for a single component', function() {
    let { f, values } = makeSink();
    let c = compose(c1);
    c.foo(Function.prototype, f);
    c.bar(Function.prototype, f);
    assert.deepEqual(['foo called', 'bar called'], values);
  });

  it('composes two components', function() {
    let { f, values } = makeSink();
    let c = compose(
      c1,
      c2
    );
    c.foo(Function.prototype, f);
    c.bar(Function.prototype, f);
    assert.deepEqual(['foo called', 'bar called', 'bar2 called'], values);
  });


  it('maintains the this binding', function() {
    let c = compose(a, b);
    let r = {};
    c.f.call(r, Function.prototype);
    assert.deepEqual(3, r.x);
  });

  it('is associative', function() {
    let c1 = compose(a, compose(b, c));
    assert.deepEqual(3, c1.g(Function.prototype, 0))
    let c2 = compose(compose(a, b), c);
    assert.deepEqual(3, c2.g(Function.prototype, 0))
    let c3 = compose(a, b, c);
    assert.deepEqual(3, c3.g(Function.prototype, 0))
  });
});

describe('close', function() {
  it('partially applies a noop', function() {
    let co = close(compose(a, b, c));
    assert.deepEqual(3, co.g(0))
  });
});

describe('bind', function() {
  it('sets the this binding for a component', function() {
    let t = {};
    let c = bind(a, t);
    c.f(Function.prototype);
    assert.equal(2, t.x);
  });
});

describe('when and whenNot', function() {
  it('example case', function() {
    let comp = compose(a, b, c);
    assert.equal(3, comp.g(Function.prototype, 0));
  });

  describe('when', function() {
    it('causes a component to only be active when a property is true on the this binding', function() {
      let comp = compose(
        a,
        when('y', b),
        c
      );
      assert.equal(2, comp.g.call({y: false}, Function.prototype, 0));
      assert.equal(3, comp.g.call({y: true}, Function.prototype, 0));
    });
  });

  describe('whenNot', function() {
    it('causes a component to only be active when a property is false on the this binding', function() {
      let comp = compose(
        a,
        whenNot('y', b),
        c
      );
      assert.equal(3, comp.g.call({y: false}, Function.prototype, 0));
      assert.equal(2, comp.g.call({y: true}, Function.prototype, 0));
    });
  });
});
