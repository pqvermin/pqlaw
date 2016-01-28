var ViewModel = function(model) {
  var self = this;
  this.model = model;
  this.items = model.items;
  this.pq = model.pq;
  this.highlight = {toggle:true,text:ko.observable('HighlightOn')};
  this.selectedVariety = ko.observable('clause');
  this.switchItemTemplate = function(data, event) {
      return 'template-item-' + data.variety
  }
  this.openItem = function(options) {
    return function(data, event) {
      self.model.attach(options);
    };
  }
  this.openAll = function(data, event) {
    self.model.attachAll()
  }
  this.openLinkedClause = function(data, event){
    var l = self.pq.getLink(data.pid);
    self.model.attachItemsAfter(l,data)
  }
  this.closeAll = function(data, event) {
    self.model.detachAll();
  }
  this.closeThis = function(data, event) {
    self.model.detach(data);
  }
  this.closeOthers = function(data, event) {
    self.model.detachOthers(data);
  }
  this.getClauseText = function(pid){
    var t = this.pq.getAttribute(pid, 'text');
    t = PQlaw.decodeHTML(t)
    if(this.highlight.toggle){
      t = PQlaw.highlightText(t)
    }
    return t;
  }
  this.getItemAttribute = function(pid, attribute) {
    var t = this.pq.getAttribute(pid, attribute);
    t = PQlaw.decodeHTML(t)
    return t;
  }
  this.toggleHighlight = function() {
    this.highlight.toggle = !this.highlight.toggle;
    var t = this.highlight.toggle? 'HighlightOn' : 'HighlightOff';
    this.highlight.text(t);
  }
  this.entryItem = function(data, event) {
    var pid = $('#item-edit-entry-text').val();
    if(event.type === 'click') {
      if(!pid) return;
    } else if(event.type === 'keydown') {
      if (event.keyCode !== 13) return true;
      if (event.keyCode === 13 && pid ==='') return false;
    }
    if(self.pq.isEntry(pid)) {
      alert('error; dupulicated name');
      return false;
    }
    var variety = self.selectedVariety();
    self.pq.entryItem(variety,pid);
    self.model.detachAll();
    self.model.attach({variety:'edit'})
    return false;
  }
  this.deleteItem = function(data, event) {
    var $li = $('.item-edit-list').has(event.target);
    var pid = $li.data('pid');
    self.pq.deleteItem(pid);
    self.model.detachAll();
    self.model.attach({variety:'edit'})
  }
  this.sortItem = function(data, event){
    var item = ko.contextFor(event.target).$parent;
    var $li = $('.item-edit-list');
    var $clicked = $li.has(event.target);
    var $selected = $li.filter('[data-selected=on]');
    var isClickedOn = $clicked.is('[data-selected=on]')
    var isAnySelected = $li.is('[data-selected=on]');
    var idxClicked = $li.index($clicked);
    var idxSelected = $li.index($selected);
    var insertMethod = (idxClicked < idxSelected)? 'before' : 'after';
    if(!isAnySelected) {
      $clicked.attr('data-selected', 'on');
    } else if(isClickedOn) {
      $clicked.attr('data-selected', 'off');
    } else {
      $selected.attr('data-selected', 'off');
      $clicked[insertMethod]($selected);
      self.pq.changeOrder(self.selectedVariety(), idxSelected, idxClicked)
      self.model.detachOthers(item);
    }
  }
  this.openEditPid = function(data, event) {
    var $e = $(event.target);
    $e.hide();
    $e.next().show().focus();
  }
  this.saveEditPid = function(data, event) {
    var $e = $(event.target);
    var val = $e.val();
    if (event.keyCode !== 13) return true;
    if (event.keyCode === 13 && val ==='') return false;
    $e.hide();
    $e.prev().show();
    if (data !== val && !self.pq.isEntry(val)) {
      self.pq.resetPid(data,val);
      self.model.detachAll();
      self.model.attach({variety:'edit'})
    }
  }
  this.saveEditItem = function(data, event){
    var form = event.target.closest('form');
    var text = form.text.value;
    var appendix = form.appendix.value;
    self.pq.setAttribute(data.pid, 'text', text);
    self.pq.setAttribute(data.pid, 'appendix', appendix);
    self.model.detachAll();
    self.model.attach({variety:'edit-item',pid:data.pid});
  }
  this.saveLinkClause = function(data, event){
    var item = ko.contextFor(event.target).$parent;
    var linkType = event.target.value;
    if(linkType === 'from') self.pq.setLink(item.pid, data);
    else if (linkType === 'to') self.pq.setLink(data, item.pid);
    else if (linkType === 'non') {
      self.pq.unsetLink(item.pid, data);
      self.pq.unsetLink(data, item.pid);
    }
    self.model.detachOthers(item);
  }
//
////todo
//
  this.searchItem = function(data, event){
    var val = event.target.value;
    if (event.keyCode !== 13) return true;
    if (event.keyCode === 13 && val ==='') return false;
    console.log(val);
    return false;
  }
  this.saveNoteClause = function(){}
  this.saveLinkCollection = function(){}
  this.save = function() {}
  this.print = function() {}
}
ko.bindingHandlers.htmlWithBinding = {
  'init': function() {
    return { 'controlsDescendantBindings': true };
  },
  'update': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    ko.utils.setHtml(element, valueAccessor());
    ko.applyBindingsToDescendants(bindingContext, element);
  }
};

//ko.applyBindings(new ViewModel(new Model(new PQlaw(JSON.parse($('#storeContainer').html())))));

//
// test
//
var x1 = "法１６の２：植物等の移動の制限";
var y1 = "植物防疫法";
var s = JSON.parse($('#store-container').html());
var pq = new PQlaw(s);
var m = new Model(pq)
var v = new ViewModel(m);
ko.applyBindings(v);
//m.attach(x1);
