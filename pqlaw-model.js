var Item = function(variety, pid) {
  this.variety = variety;
  this.pid = pid;
  this.title = pid || variety.charAt(0).toUpperCase() + variety.slice(1);
}
var Model = function(pqlaw) {
  this.pq = pqlaw;
  this.items = ko.observableArray().extend({
    deferred: true
  });
}
Model.singltonVariety = ['edit'];
Model.editableVariety = ['edit-item', 'link-clause', 'link-collection', 'note-clause'];
Model.varietyList = ['help', 'contents', 'graph', 'clause', 'collection']
  .concat(Model.singltonVariety)
  .concat(Model.editableVariety);
Model.prototype.isOpen = function(variety, pid) {
  var check1 = this.items().some(function(v) {
    return v.variety === variety;
  }
  );
  var check2 = this.items().some(function(v) {
    return v.variety === variety && v.pid === pid;
  }
  );
  if (!pid && check1) {
    return true;
  } else if (pid && check2) {
    return true;
  } else {
    return false;
  }
}
Model.prototype.prohibitDuplication = function(variety, pid) {
  if (Model.singltonVariety.indexOf(variety) !== -1 && this.isOpen(variety)) {
    return true;
  } else if (Model.editableVariety.indexOf(variety) !== -1 && this.isOpen(variety, pid)) {
    return true;
  } else {
    return false;
  }
}
Model.prototype.attachAll = function() {
  var l = this.pq.getPids();
  var variety;
  l.forEach(function(v) {
    variety = this.pq.getAttribute(v,'variety');
    this.items.push(new Item(variety,v))
  }
  .bind(this))
}
Model.prototype.attach = function(options) {
  //options={variety,pid,after}
  var pid = options.pid;
  var variety = options.variety || this.pq.getAttribute(pid,'variety');
  if (this.prohibitDuplication(variety, pid)) return;
  var item = new Item(variety,pid);
  if(options.after){ //attach after item
    var i = this.items.indexOf(options.after);
    var pre = this.items.slice(0, i + 1);
    var post = this.items.slice(i + 1);
    this.items(pre.concat(item).concat(post));
  } else { // attach first
    this.items.unshift(item);
  }
}
Model.prototype.attachItemsAfter = function(pidAry, item) {
  var l = pidAry.reverse();
  l.forEach(function(v) {
    this.attach({
      'variety':this.pq.getAttribute(v,'variety'),
      'pid':v,
      'after':item
    })
  }.bind(this))
}
Model.prototype.detachAll = function() {
  this.items.removeAll();
}
Model.prototype.detach = function(item) {
  this.items.remove(item);
}
Model.prototype.detachOthers = function(item) {
  this.items.remove(function(v) {
    return v !== item;
  });
}
