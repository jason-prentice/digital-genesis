var getBeginningWords = function(text, count){
	return text.split(/\s+/).slice(0,count).join(" ");
};

var prepareNotePopovers = function(selector){
	$(function () {
		$(selector+' [data-toggle="popover"]')
		.popover({
			container: selector, 
			html: true, 
			placement: "bottom", 
			sanitize: false
		});
	});
};

var setView = function(){
	teiPanel.setMainView();
	teiPanel.setVisibility();
	parallelPanel.setMainView();
	parallelPanel.setVisibility();
	parallelPanel.setHtml();
	documentarySources.setVisibility();
	outlinePanel.setVisibility();
	tools.setVisibility();
}

$(document).ready(function(){
	setView();
});

/*** CETEIcean ***/

/*Convert a TEI document to HTML and insert into #TEI.*/
var CETEI;
if (CETEI) {
	var CETEIcean = new CETEI()
	//CETEIcean.getHTML5("https://raw.githubusercontent.com/bulib/dcgenesis/master/tei/gen1-15_master.xml", function(data) {
	CETEIcean.getHTML5("tei/gen-noah-flood-chiasm_master_11-27-20.xml", function(data) {
		document.getElementById("TEI").appendChild(data);		
		$('tei-anchor').wrap(function(){
			var ID = $(this).attr('id');
			var selector = 'tei-note[target="#'+ID+'"]';
			var html = $(selector).find('[hidden]').html();
			if(html){
				html = html.replace(/"/g, "&quot;");
				html = html.replace(/.+Comment:/g, "<hr />Comment:");
				html = html.replace(/.+Alt\. Trans\.:/g, "<hr />Alt. Trans.:");
				return '<a tabindex="0" data-toggle="popover" data-trigger="focus" data-content="' + html + '" />' ;
			}
			return false;
		});  
		$('tei-div[type="parallel"]').each(function(){
			var newId = $(this).attr("xml\:id").replace("pr","'");
			$(this).attr("display", newId);
		});
		outlinePanel.setHtml();
		themes.setHtml();
		$("tei-seg[type='verse']").wrap("<sup />");
		$("tei-anchor").html("<sup><i class='far fa-comment-alt light'></i><sup>");
		prepareNotePopovers(teiPanel.selector);
	});	
}	

/*** MAIN VIEW MODE ***/
var mainViewMode = {
	selector: 'input[name="view"]',
	setSelectedView: function(selectedView){
		$(this.selector+"[value=" + selectedView + "]").prop('checked', true);
	},
	getSelectedView: function(){
		var selectedView = $(this.selector+':checked').val();
		if (!selectedView) { 
			selectedView = "chapter-view";
			this.setSelectedView(selectedView);
		};
		return selectedView;
	},
	getViews: function(){
		return ["chapter-view","chiastic-view"];
	}
};

$(document).on("change", mainViewMode.selector, function() {
	setView();
	teiParallel.clearHighlighting();
	outlinePanel.clearHighlighting();
});


/*** THEMES ***/

var themes = {
	thematicElementSelector: "tei-seg[ana!=''][ana]",
	htmlSectionSelector: "#themesHtml",
	setHtml: function(){
		var thematicGroupings = {};
		$(this.thematicElementSelector).each(function(){
			var theme = $(this).attr("ana");
			theme = theme.replace("#","");
			var text = $(this).text();
			text = getBeginningWords(text, 5);
			if(thematicGroupings[theme]){
				thematicGroupings[theme].push(text);
			} else {
				thematicGroupings[theme] = [text];			
			}
			
		});
		var htmlArray = [];
		Object.entries(thematicGroupings).forEach(function(group){
			var [key, valueArray] = group;
			html = '<div class="accordion"> \
              <span class="small">'+key+'</span> \
              <div> \
                <span class="badge">'+valueArray.length+'</span> \
                <span><i class="fas fa-chevron-down arrow light" aria-hidden="true"></i><span class="sr-only">Expand or collapse section</span></span> \
              </div> \
            </div> \
            <div class="interp-group"> \
              <span class="small light choose-formatting"> Choose formatting</span>';
            
            valueArray.forEach(function(value){
				html = html+'<p class="small">'+value+'</p>'
            });
            var html = html+'</div>';      
            htmlArray.push(html);
		});
		$(this.htmlSectionSelector).html(htmlArray.join(""));
	}
}

/*** DOCUMENTARY SOURCES ***/

var documentarySources = {
	toggleSelector: "#sources-toggle",
	sources: ["yahwist","priestly"],
	setVisibility: function(){
		if(this.getVisibility()){
			var sources = this.sources;
			$(document).ready(function(){
				sources.forEach(function(source){	
						
					$("tei-seg[ana='#"+source+"']").addClass("show-"+source);
					
				});
			});
		} else {
			this.sources.forEach(function(source){
				$(".show-"+source).removeClass("show-"+source);
			});
			
		}
	},
	getVisibility: function() {
		if($(this.toggleSelector).is(':checked')){
			return true;
		} else {
			return false;
		}
	},
}

$(document).on("change", documentarySources.toggleSelector, function() {
	documentarySources.setVisibility();
});

/*** TEI PANEL ***/

var teiPanel = {
	selector: "#TEI",
	compatibleViews: ["chapter-view", "chiastic-view"],
	setMainView: function(){
		var selector = this.selector;
		var selectedView = mainViewMode.getSelectedView();

		var views = mainViewMode.getViews();
		views.forEach(function(view){
			if(view !== selectedView){
				$(selector).removeClass(view);
			}
		})
		$(selector).addClass(selectedView);
	},
	setVisibility: function(){
		var selectedView = mainViewMode.getSelectedView();
		if(this.compatibleViews.includes(selectedView)){
			$(this.selector).show();
		} else {
			$(this.selector).hide();
		}
	}
}


/*** TEI PARALLEL ***/

var teiParallel = {
	selector: "#TEI tei-div[type='parallel']",

	handleMouseover: function(currentParallel) {
		if(parallelPanel.getVisibility()){
			this.clearHighlighting();
			$(currentParallel).addClass("active");
			var correspSelector = $(currentParallel).attr("corresp");
			parallelPanel.setHtml(correspSelector);
		}
	},
	clearHighlighting: function(){
		$(this.selector).removeClass("active");
	}
};

$(document).on("mouseover", teiParallel.selector, function() {
		teiParallel.handleMouseover(this);
	});

/*** OUTLINE PANEL ***/

var outlinePanel = {
	selector: "#outline",
	outlineLinkSelector: "#outline .outline-link",
	htmlSectionSelector: "#outlineHtml",
	compatibleViews: ["outline-view"],
	setVisibility: function(){
		var selectedView = mainViewMode.getSelectedView();
		if(this.compatibleViews.includes(selectedView)){
			$(this.selector).show();
		} else {
			$(this.selector).hide();
		}
	},
	handleMouseover: function(currentOutlineLink){
		if(parallelPanel.getVisibility()){
			this.clearHighlighting();
			$(currentOutlineLink).addClass("active");
			var parallelSelector = $(currentOutlineLink).attr("data-parallel");
			parallelPanel.setHtml(parallelSelector);
		}
	},
	clearHighlighting: function(){
		$(this.outlineLinkSelector).removeClass("active");
	},
	
	setHtml: function(){
		var html = "";
		var outlineLevel = 0;
		var regex = /\d+/;
		var countPrimes = 0;
		$(teiParallel.selector).each(function(){
			var id = $(this).attr("id");
			
			if(!regex.test(id)) {
				if (id.includes("pr")){
					countPrimes = countPrimes + 1;
					if(countPrimes != 1){
						outlineLevel = outlineLevel - 1;
					}
				} else {
					outlineLevel = outlineLevel + 1;
				}
			
				outlineLevel = outlineLevel >= 1? outlineLevel : 1;
				var text = $(this).text();
				text = getBeginningWords(text, 8);
				html += "<p class='outline-link outline-level-"+outlineLevel+"' data-parallel='#"+id+"'><b>"+$(this).attr("display")+":</b> "+text+"...</p>";			
			}
			
		});
		
		$(this.htmlSectionSelector).html(html);
	}
}

$(document).on("mouseover", outlinePanel.outlineLinkSelector, function() {
	outlinePanel.handleMouseover(this);
});

/*** PARALLEL PANEL ***/

var parallelPanel = {
	selector: "#parallel",
	htmlSectionSelector: "#parallelHtml",
	parallelLinkSelector: "#parallelLink",
	toggleSelector: "#parallel-toggle",
	toggleLabelSelector: "label[for='parallel-toggle']",
	compatibleViews: ["chapter-view", "chiastic-view", "outline-view"],

	setVisibility: function() {
		if(this.getVisibility()){
			$(this.selector).show();
		} else {
			$(this.selector).hide();
			this.setHtml();
			teiParallel.clearHighlighting();
			outlinePanel.clearHighlighting();
		}
	},
	getVisibility: function() {
		var selectedView = mainViewMode.getSelectedView();
		if(this.compatibleViews.includes(selectedView)){
			//return viewOptions.checkOptionSelected(this.viewOption);
			if($(this.toggleSelector).is(':checked')){
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	},
	setHtml: function(sectionSelector) {
		var selectedView = mainViewMode.getSelectedView();
		if (this.compatibleViews.includes(selectedView)){
			$(this.toggleSelector).show();
			$(this.toggleLabelSelector).show();
		} else {
			$(this.toggleSelector).hide();
			$(this.toggleLabelSelector).hide();
		}
		if(selectedView === "outline-view"){
			$(this.toggleLabelSelector).text("Show section text");
			if(sectionSelector) {
				var html = $(sectionSelector).html();

				$(this.htmlSectionSelector).html(html);
				$(this.htmlSectionSelector).find('a[data-toggle="popover"]').remove();
				
			} else {
				$(this.htmlSectionSelector).html("<p class='small'><i>Hover over a section of the outline to view the full contents in this panel.</i></p>");
			}
		} else {
			$(this.toggleLabelSelector).text("Show chiastic parallel");
			if(sectionSelector){
				var partnerId = $(teiParallel.selector+"[corresp='"+sectionSelector+"']").attr("id");
				$(this.htmlSectionSelector).html("<span id='parallelLink' data-corresp='#"+partnerId+"'>Chiastic Parallel: <a href='"+sectionSelector+"'>"+$(sectionSelector).attr("display")+"</a></span>"+$(sectionSelector).html());
				$(this.htmlSectionSelector).find('a[data-toggle="popover"]').remove();
			} else {
				$(this.htmlSectionSelector).html("<p class='small'><i>Hover over a section of the text to view its chiastic parallel in this panel.</i></p>");
			}
		}
	},
	setMainView: function(){
		var selectedView = mainViewMode.getSelectedView();
		var selector = this.selector;
		var views = mainViewMode.getViews();
		views.forEach(function(view){
			if(view !== selectedView){
				$(selector).removeClass(view);
			}
		})
		$(selector).addClass(selectedView);
	}
}

$(document).on("change", parallelPanel.toggleSelector, function() {
	parallelPanel.setVisibility();
})*

$(document).on("click", parallelPanel.parallelLinkSelector, function() {
	parallelPanel.setHtml($(parallelPanel.parallelLinkSelector).attr("data-corresp"));
});

/*** TOOLS ***/

var tools = {
	selector: "#interp",
	toggleSelector:"#tools-toggle",
	toggleLabelSelector:"#tools-toggle-label",
	closeSelector: ".close[data-for='interp']",
	compatibleViews: ["chapter-view", "chiastic-view", "outline-view"],
	setVisibility: function(){
		var selectedView = mainViewMode.getSelectedView();
		if(this.compatibleViews.includes(selectedView)){

			if($(this.toggleSelector).is(':checked')){
				$(this.selector).show();
				$(this.toggleLabelSelector).hide();
			} else{
				$(this.selector).hide();
				$(this.toggleLabelSelector).show();
			}
		} else {
			$(this.selector).hide();
			$(this.toggleLabelSelector).hide();
		}
	}
}
$(document).on("click", tools.toggleLabelSelector, function() {
	$(tools.toggleSelector).prop('checked', true);
	tools.setVisibility();
});
$(document).on("click", tools.closeSelector, function() {
	$(tools.toggleSelector).prop('checked', false);
	tools.setVisibility();
});




$(document).on("click", ".nav-item", function() {
	$('.nav-item').removeClass('active');
	$(this).addClass('active');
	var section = $(this).attr('data-section');
	
	if (["about","bibliography"].indexOf(section) >= 0){
		var html = "includes/"+section+".html"
		$("#page").load(html);
		$("#page").show();
		$("#text").hide();
	} else {
		$("#page").hide();
		$("#text").show();
	}
});

$( document ).on("click",".accordion", function() {	
    var panel = $(this).next();
    var arrow = $(this).find('.arrow');
    if (panel.css('max-height')==="0px"){
      var height = panel.prop('scrollHeight')+ "px";
      panel.css('max-height',"800px");
      arrow.removeClass('fa-chevron-down');
      arrow.addClass('fa-chevron-up');
    } else {
    	panel.css('max-height','0px');
    	arrow.removeClass('fa-chevron-up');
      	arrow.addClass('fa-chevron-down');
    } 
});

/*$( document ).on( "click", ".interp", function() {
	var targetID = $(this).attr('id');
	$('#target').attr('data-target',targetID);
	$("#formatter").dialog( "option", "position", { my: "left top", at: "left bottom", of: $(this), collision: "fit" } );
	$("#formatter").dialog('open');
});*/
	
/*$( document).on( "click", ".formatter", function() {
	var newStyle= $(this).attr('id');
	var target = $('#target').attr('data-target');
	var targetID = "#"+target;
      
	if (newStyle === "none"){
		var currentStyle = $(targetID).attr('data-style');
		clearFormatting(currentStyle);
	} else {
		var selector = '[ana="'+targetID+'"]';
		$(targetID).attr('data-style', newStyle);
		$(selector).attr('data-style', newStyle);
	}
	var panel = $(targetID).parent();
		var height = panel.prop('scrollHeight')+ "px"
		panel.css('max-height',height);
	$( "#formatter" ).dialog( "close" );
	updateBadges();
});*/
	 
/*$( document).on( "change", ".menu-item", function() {
	var section= $(this).attr('data-for');
	var selector= '#'+section;
	if($(this).is(':checked')) {
		$(selector).show();
	} else {
		$(selector).hide();
	}
});*/

/*$(document).on("click", ".help", function() {
	$(this).parent().parent().next().show();
})*/

/*$(document).on("click", ".ok", function() {
	$(this).parent().hide();
})*/

/*$(document).on("click", "#clear-formatting", function() {
	clearFormatting();
	updateBadges();
})*/

/*function updateBadges(){
	$('.accordion').each(function(){
		var selectionCount = $(this).next().find('p[data-style]').length;
		$(this).find('.badge').text(selectionCount);
	});
}*/

/*function clearFormatting(dataStyle) {
	if(dataStyle){
		var selector = "[data-style='"+dataStyle+"']";
		$(selector).removeAttr('data-style');
	} else {
		$('[data-style]').removeAttr('data-style');
	}
}*/

/*function displayAnalyzeSelection(selection){
	var html = "includes/analyze-"+selection+".html";
	$("#prompt").load(html);
	$("#prompts").scrollTop(0);
}

$( function() {
  $( "#formatter" ).dialog({
		autoOpen: false,
		modal: true,
		buttons: [{
			id: "Cancel",
			text: "Cancel",
			click: function () {
				$(this).dialog('close');
			}
		}]
	});
});*/