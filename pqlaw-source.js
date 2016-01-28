var PQlaw = function(json) {
  this.src = json;
  this.collection = json.collection;
  this.clause = json.clause;
  this.linkCollection = json.linkCollection;
  this.linkClause = json.linkClause;
}
PQlaw.keywords = [
[
/(法*第[一二三四五六七八九十]+[条項号](の一|の二|の三|の四|の五|の六|の七|の八|の九|の十|)[一二三四五六七八九十]*(ただし書)*(様式)*)/gm,
'<span class="highlight articlename">$1</span>'
],
[
/(〔[^〕]+〕|［[^］]+］|農林水産省令|別表[一二三四五六七八九十]+|[前同次][条項号])/gm,
'<span class="highlight articlename">$1</span>'
],
[
/(及び|又は|若しくは)/gm,
'<span class="highlight conjunction">$1</span>'
],
[
/(ただし)([^書])/gm,
'<span class="highlight conjunction">$1</span>$2'
]
];
PQlaw.highlightText = function(clauseText) {
  var decorateKeywords = function(string) {
      var t = string;
      PQlaw.keywords.forEach(function(v){
          t = t.replace(v[0], v[1]);
      })
      return t;
  }
  var cn = $('<div>').html(clauseText).contents();
  var text = '';
  cn.each(function(i,el) {
      if (el.nodeType === 3) {
          text += decorateKeywords(el.nodeValue);
      } else {
          text += el.outerHTML;
      }
  });
  return text;
}
PQlaw.encodeHTML = function(string) {
  var e = document.createElement('div');
  e.appendChild(document.createTextNode(string));
  return e.innerHTML;
}
PQlaw.decodeHTML = function(string) {
  var e = document.createElement('div');
  e.innerHTML = string;
  return e.textContent;
}
PQlaw.prototype.isClause = function(pid) {
  return this.clause.some(function(v) {
    return v.pid === pid
  }
  )
}
PQlaw.prototype.isCollection = function(pid) {
  return this.collection.some(function(v) {
    return v.pid === pid
  }
  )
}
PQlaw.prototype.isEntry = function(pid) {
  return this.isClause(pid) || this.isCollection(pid);
}
PQlaw.prototype.isLink = function(from, to) {
  var f = function(v) {
    return v[0] === from && v[1] === to;
  }
  return this.linkCollection.some(f) || this.linkClause.some(f);
}
PQlaw.prototype.getAllItem = function() {
  return this.collection.concat(this.clause);
}
PQlaw.prototype.getPids = function(variety) {
  if (variety && variety !== 'collection' && variety !== 'clause')
    return;
  var f = function(v) {
    return v.pid;
  }
  if (variety) {
    return this[variety].map(f);
  } else {
    return this.getAllItem().map(f);
  }
}
PQlaw.prototype.getItem = function(pid) {
  var f = function(v) {
    return v.pid === pid;
  }
  return this.collection.filter(f)[0] || this.clause.filter(f)[0];
}
PQlaw.prototype.getAttribute = function(pid, attribute) {
  if(!this.isEntry(pid)) return;
  return this.getItem(pid)[attribute];
}
PQlaw.prototype.getOrder = function(pid) {
  var c = this.getAttribute(pid, 'variety');
  return this.getPids(c).indexOf(pid);
}
PQlaw.prototype.getLink = function(pid, type) {
  //type = from|to|non|all|undefined -> from + to + non
  var l = this.isCollection(pid) ? this.linkCollection : this.linkClause
  if (type === 'from' || type === 'to') {
    var j = (type === 'from') ? 0 : 1;
    return l.filter(function(v) {
      return v[j] === pid;
    }).map(function(v) {
      return v[1 - j];
    });
  } else if (type === 'non') {
    var ary = this.getLink(pid, 'from').concat(this.getLink(pid, 'to')).concat(pid);
    return this.getPids('clause').filter(function(v) {
      return ary.every(function(u) {
        return u !== v;
      });
    });
  } else if (type === 'all') {
    return this.getLink(pid, 'from').concat(this.getLink(pid, 'to')).concat(this.getLink(pid, 'non'));
  } else if (!type) {
    return this.getLink(pid, 'from').concat(this.getLink(pid, 'to'));
  }
}
PQlaw.prototype.getLinkType = function(pid, target) {
  if(this.isLink(pid, target)) return 'from';
  if(this.isLink(target, pid)) return 'to';
  return 'non';
}
PQlaw.prototype.setAttribute = function(pid, attribute, value) {
  if (attribute !== 'text' && attribute !== 'appendix') {
    return;
  }
  this.getItem(pid)[attribute] = value;
}
PQlaw.prototype.setLink = function(from, to) {
  if (this.isLink(from, to)) {
    return;
  }
  if (this.isLink(to, from)) {
    unsetLink(to, from);
  }
  var c = this.isCollection(from) ? 'linkCollection' : 'linkClause';
  this[c].push([from, to]);
  this.sortLink();
}
PQlaw.prototype.unsetLink = function(from, to) {
  var f = function(v) {
    return !(v[0] === from && v[1] === to);
  }
  var c = this.isCollection(from) ? 'linkCollection' : 'linkClause';
  this[c] = this[c].filter(f);
}
PQlaw.prototype.sortLink = function() {
  var compare = function(j, k) {
    var i = this.getOrder(j[0]) - this.getOrder(k[0]);
    if (i === 0) {
      return this.getOrder(j[1]) - this.getOrder(k[1]);
    } else {
      return i;
    }
  }
  .bind(this)
  //sort Clause first, then sort Collection
  this.linkClause.sort(compare);
  this.linkCollection.sort(compare);
}
PQlaw.prototype.resetPid = function(pid, newPid) {
  if (this.isEntry(newPid)) {
    return;
  }
  this.getItem(pid)['pid'] = newPid;
  //update link
  var f = function(v) {
    for (var j = 0; j < 2; j++) {
      if (v[j] === pid) {
        v[j] = newPid;
      }
    }
  }
  this.linkCollection.forEach(f);
  this.linkClause.forEach(f);
}
PQlaw.prototype.entryItem = function(variety, pid, text, appendix) {
  if (this.isEntry(pid)) {
    return;
  }
  var item = {
    'variety': variety,
    'pid': pid
  };
  if (variety === 'clause') {
    item.text = text;
    item.appendix = appendix;
  }
  this[variety].push(item)
}
PQlaw.prototype.deleteItem = function(pid) {
  var c = this.getAttribute(pid, 'variety')
  this[c] = this[c].filter(function(v) {
    return v.pid !== pid;
  }
  );
  var f = function(v) {
    return v[0] !== pid && v[1] !== pid;
  }
  this.linkCollection = this.linkCollection.filter(f);
  this.linkClause = this.linkClause.filter(f);
}
PQlaw.prototype.changeOrder = function(variety, idxFrom, idxTo) {
  var item = this[variety];
  item.splice(idxTo, 0, item.splice(idxFrom, 1)[0]);
}
