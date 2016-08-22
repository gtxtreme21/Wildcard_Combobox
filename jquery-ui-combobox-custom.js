 /*!
  * This is a heavily modified version of the jquery ui combobox. Please ask Gary Tipton for help.
  * If 'wildcard' is passed as an option during initialization it will perform wild card matches.
  * 
  * 
  * 
 * Copyright Ben Olson (https://github.com/bseth99/jquery-ui-extensions)
 * jQuery UI ComboBox @VERSION
 *
 *  Adapted from Jörn Zaefferer original implementation at
 *  http://www.learningjquery.com/2010/06/a-jquery-ui-combobox-under-the-hood
 *
 *  And the demo at
 *  http://jqueryui.com/autocomplete/#combobox
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 */

(function( $, undefined ) {

   $.widget( "ui.combobox", {

      version: "@VERSION",

      widgetEventPrefix: "combobox",

      uiCombo: null,
      uiInput: null,
      _wasOpen: false,
      //Default the calling app to normal
      fnOverride: "normal",
      
      _create: function() {

         var self = this,
             select = this.element.hide(),
             input, wrapper;
         
         var fnOverride = this.options.fnOverride;
         if (!fnOverride) {
        	 fnOverride = "normal";
         }

         input = this.uiInput =
                  $( "<input />" )
                      .insertAfter(select)
                      .addClass("ui-widget ui-widget-content ui-corner-left ui-combobox-input")
                      .val( select.children(':selected').text() )
                      .attr('tabindex', select.attr( 'tabindex'))
                      .width(availableWidth($(this.element)))
                      .click(function(){
                    	  this.select();
                      });

         wrapper = this.uiCombo =
            input.wrap( '<span>' )
               .parent()
               .addClass( 'ui-combobox' )
               .insertAfter( select )
               .addClass("comboboxwrapper");

         input
          .autocomplete({

             delay: 0,
             minLength: 0,
             
             appendTo: wrapper,
             source: $.proxy( this, "_linkSelectList",  fnOverride),
             select: function(event, ui) {
               //var selectedObj = ui.item;              
               $(this).attr('title', ui.item.value);
           }
          });

         $( "<button>" )
            .attr( "tabIndex", -1 )
            .attr( "type", "button" )
            .insertAfter( input )
            .button({
               icons: {
                  primary: "ui-icon-triangle-1-s"
               },
               text: false
            })
            .removeClass( "ui-corner-all" )
            .addClass( "ui-corner-right ui-button-icon ui-combobox-button" );


         // Our items have HTML tags.  The default rendering uses text()
         // to set the content of the <a> tag.  We need html().
         input.data( "ui-autocomplete" )._renderItem = function( ul, item ) {

               return $( "<li>" )
                           .attr('class', item.option.className)
                           .append( $( "<a>" ).html( item.label ) )
                           .appendTo( ul );

            };

         this._on( this._events );

      },


      _linkSelectList: function( fnOverride, request, response ) {

    	  if (fnOverride && "wildcard" ==  fnOverride) {

    		  response( this.element.children('option:not([style*="display: none"])').map(function() {           
                  var text = $( this ).text();
                  var optionData = null;                  

            	  var matchers = buildMatchers(request.term);
            	  optionData = filterOptionsWildCard(this, request.term, matchers, text);
            	  return optionData;
              })
           );       	 
         } else {
         var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), 'i' );
         //response( this.element.children('option').map(function() {
         response( this.element.children('option:not([style*="display: none"])').map(function() {           
                  var text = $( this ).text();

                  if ( this.value && ( !request.term || matcher.test(text) ) ) {
                     var optionData = {
                         label: text,
                         value: text,
                         option: this
                     };
                     if (request.term) {
                        optionData.label = text.replace(
                           new RegExp(
                              "(?![^&;]+;)(?!<[^<>]*)(" +
                              $.ui.autocomplete.escapeRegex(request.term) +
                              ")(?![^<>]*>)(?![^&;]+;)", "gi"),
                              "<strong>$1</strong>");
                    }
                    return optionData;
                  }
              })
           );
         }

      },

      _events: {

         "autocompletechange input" : function(event, ui) {

            var $el = $(event.currentTarget);
            var changedOption = ui.item ? ui.item.option : null;
            if ( !ui.item ) {

               var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $el.val() ) + "$", "i" ),
               valid = false,
               matchContains = null,
               iContains = 0,
               iSelectCtr = -1,
               iSelected = -1,
               optContains = null;
               if (this.options.autofillsinglematch) {
                  matchContains = new RegExp($.ui.autocomplete.escapeRegex($el.val()), "i");
               }


               this.element.children( "option" ).each(function() {
                     var t = $(this).text();
                     if ( t.match( matcher ) ) {
                        this.selected = valid = true;
                        return false;
                     }
                     if (matchContains) {
                        // look for items containing the value
                        iSelectCtr++;
                        if (t.match(matchContains)) {
                           iContains++;
                           optContains = $(this);
                           iSelected = iSelectCtr;
                        }
                     }
                  });

                if ( !valid ) {
                   // autofill option:  if there is just one match, then select the matched option
                   if (iContains == 1) {
                      changedOption = optContains[0];
                      changedOption.selected = true;
                      var t2 = optContains.text();
                      $el.val(t2);
                      $el.data('ui-autocomplete').term = t2;
                      this.element.prop('selectedIndex', iSelected);
                      console.log("Found single match with '" + t2 + "'");
                   } else {

                	   // Commented to Remove the functionality of Clearing when focus is out
                	   
                      // remove invalid value, as it didn't match anything
                      //$el.val( '' );

                      // Internally, term must change before another search is performed
                      // if the same search is performed again, the menu won't be shown
                      // because the value didn't actually change via a keyboard event
                      $el.data( 'ui-autocomplete' ).term = '';

                     // Commented to Remove the functionality of Clearing when focus is out
                     // this.element.prop('selectedIndex', -1);
                   }
                }
            }

            this._trigger( "change", event, {
                  item: changedOption
                });

         },

         "autocompleteselect input": function( event, ui ) {

            ui.item.option.selected = true;
            this._trigger( "select", event, {
                  item: ui.item.option
               });

         },

         "autocompleteopen input": function ( event, ui ) {

            this.uiCombo.children('.ui-autocomplete')
               .outerWidth(this.uiCombo.outerWidth(true));
         },

         //"mousedown .ui-combobox-button" : function ( event ) {
         //   this._wasOpen = this.uiInput.autocomplete("widget").is(":visible");
         //},

         "click .ui-combobox-button" : function( event ) {

            this.uiInput.focus();

            // close if already visible
            if (this._wasOpen)
               return;

            // pass empty string as value to search for, displaying all results
            this.uiInput.autocomplete("search", "");
            //this.uiInput.focus();
         }

      },

      value: function ( newVal ) {
         var select = this.element,
             valid = false,
             selected;

         if ( !arguments.length ) {
            selected = select.children( ":selected" );
            return selected.length > 0 ? selected.val() : null;
         }

         select.prop('selectedIndex', -1);
         select.children('option').each(function() {
               if ( this.value == newVal ) {
                  this.selected = valid = true;
                  return false;
               }
            });

         if ( valid ) {
            this.uiInput.val(select.children(':selected').text());
            this.uiInput.attr('title', select.children(':selected').text())
         } else {
            this.uiInput.val( "" );
            this.element.prop('selectedIndex', -1);
         }

      },

      _destroy: function () {
         this.element.show();
         this.uiCombo.replaceWith( this.element );
      },

      widget: function () {
         return this.uiCombo;
      },

      _getCreateEventData: function() {

         return {
            select: this.element,
            combo: this.uiCombo,
            input: this.uiInput
         };
      }

    });


}(jQuery));

function availableWidth(obj) {
	var parentWidth = obj.parent().width();
	var parentParentWidth = obj.parent().parent().width();
	return parentParentWidth - parentWidth;
}

function filterOptions(aValue, userInput, amatcher, text) {
    if ( aValue && ( !userInput || amatcher.test(text) ) ) {
        var optionData = {
            label: text,
            value: text,
            option: this
        };
        if (userInput) {
           optionData.label = text.replace(
              new RegExp(
                 "(?![^&;]+;)(?!<[^<>]*)(" +
                 $.ui.autocomplete.escapeRegex(userInput) +
                 ")(?![^<>]*>)(?![^&;]+;)", "gi"),
                 "<strong>$1</strong>");
       }
       return optionData;
     }	
}

function filterOptionsWildCard(thisOption, userInput, matchers, text) {
	var aValue = thisOption.value;
    if ( aValue && ( !userInput || matchesAll(matchers, text) ) ) {
        var optionData = {
            label: text,
            value: text,
            option: thisOption
        };
        if (userInput) {
        	var hilightText = hilightOptionMatches(text, userInput);
        	if (hilightText) {
        		optionData.label = hilightText;
        	} else {
	           optionData.label = text.replace(
	              new RegExp(
	                 "(?![^&;]+;)(?!<[^<>]*)(" +
	                 $.ui.autocomplete.escapeRegex(userInput) +
	                 ")(?![^<>]*>)(?![^&;]+;)", "gi"),
	                 "<strong>$1</strong>");
        	}
       }
       return optionData;
     }

}
function foundMatch(matchers, text) {
	for (i = 0; i < matchers.length; i++) {
		if ( text && matchers[i].test(text) ) {
			return true;
		}
	}
	return false;
}
function matchesAll(matchers, text) {
	for (i = 0; i < matchers.length; i++) {
		if ( text && !matchers[i].test(text) ) {
			return false;
		}
	}
	return true;
}
function buildMatchers(userInput) {
	  var matchers = [];
	  var inputTextArray = userInput.split(" ");
	  if (!inputTextArray || 2 > inputTextArray.length) {
		  matchers.push(new RegExp( $.ui.autocomplete.escapeRegex(userInput), 'i' ));
	  } else {
    	  for (i = 0; i < inputTextArray.length; i++) {
    		  var arrayItem = inputTextArray[i];
    		  if (arrayItem && "" != arrayItem && " " != arrayItem && "  " != arrayItem) {
    			  matchers.push(new RegExp( $.ui.autocomplete.escapeRegex(arrayItem), 'i' ));
    		  }
    	  }
	  }
	  //console.log(matchers);
	  return matchers;
}
function buildAlternateMatchers(userInput) {
	  var matchers = [];
	  var inputTextArray = userInput.split(" ");
	  if (!inputTextArray || 2 > inputTextArray.length) {
          var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( userInput ) + "$", "i" );
		  matchers.push(matcher);
	  } else {
  	  for (i = 0; i < inputTextArray.length; i++) {
  		  var arrayItem = inputTextArray[i];
  		  if (arrayItem && "" != arrayItem && " " != arrayItem && "  " != arrayItem) {
  			var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( arrayItem ) + "$", "i" );
  			  matchers.push(matcher);
  		  }
  	  }
	  }
	  //console.log(matchers);
	  return matchers;
}
function hilightOptionMatches(label, userInput) {
	var output = label;
	var inputTextArray = userInput.split(" ");
	if (!inputTextArray || 2 > inputTextArray.length) {
		  var temp = updateBold(label, userInput);
		  return replaceBoldMarkers(temp);
	} else {		  
		  for (i = 0; i < inputTextArray.length; i++) {
			  var tempString = inputTextArray[i];
			  if (tempString && 0 < tempString.length) {
				  output = updateBold(output, tempString);
			  }
		  }
	}
	output = replaceBoldMarkers(output);
	return output;
}
function updateBold(input, boldText) {
    var tempText = input;
    tempText = tempText.replace(new RegExp('(^|\\s)?(<strong>)(\\s|$)?','g'), '~');
    tempText = tempText.replace(new RegExp('(^|\\s)?(</strong>)(\\s|$)?','g'), '@');	
    tempText = tempText.replace(new RegExp('(^|\\s)?(' + boldText + ')(\\s|$)?','ig'), '$1~$2@$3');
	tempText = tempText.replace(new RegExp('(^|\\s)?(~~)(\\s|$)?','g'), '~');
	tempText = tempText.replace(new RegExp('(^|\\s)?(@@)(\\s|$)?','g'), '@');
    return tempText;
}
function replaceBoldMarkers(input) {
	var tempText = input;
    tempText = tempText.replace(new RegExp('(^)?(~)($)?','g'), '<strong>');
    tempText = tempText.replace(new RegExp('(^)?(@)($)?','g'), '</strong>');
	tempText = tempText.replace(new RegExp('(^)?(<strong><strong>)($)?','g'), '<strong>');    
	tempText = tempText.replace(new RegExp('(^)?(</strong></strong>)($)?','g'), '</strong>');
	return tempText;
}