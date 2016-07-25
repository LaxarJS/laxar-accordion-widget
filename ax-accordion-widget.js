/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as ng from 'angular';
import * as ax from 'laxar';
import * as patterns from 'laxar-patterns';
import 'laxar-accordion-control/ax-accordion-control';

///////////////////////////////////////////////////////////////////////////////////////////////////////////

Controller.$inject = [ '$scope', '$q' ];

function Controller( $scope, $q ) {

   let requestedPanel = -1;
   let allowNextPanelActivation = false;

   $scope.model = {
      panels: [],
      selectedPanel: 0
   };

   const localize = patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n', {
      onChange() {
         $scope.model.panels.forEach( ( areaModel, index ) => {
            areaModel.htmlLabel = localize( $scope.features.areas[ index ].i18nHtmlLabel );
         } );
      }
   } ).localizer();

   $scope.model.panels = $scope.features.areas.map( createPanelModel );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.eventBus.subscribe( 'beginLifecycleRequest', () => {
      $scope.model.panels.forEach( ( panel, i ) => {
         publishFlagIfConfigured( i, $scope.model.selectedPanel === i );
      } );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   let initialVisibilityPublished = false;
   patterns.visibility.handlerFor( $scope, {
      // set nested area visibility depending on the `areaShowing` state and on the context visibility
      onAnyAreaRequest( event ) {
         const eventArea = event.area.substring( $scope.widget.id.length + 1 );
         const index = isOk( $scope.model.selectedPanel ) ? $scope.model.selectedPanel : requestedPanel;
         const selectedArea = $scope.model.panels[ index ].areaName;
         return event.visible && eventArea === selectedArea;

         //////////////////////////////////////////////////////////////////////////////////////////////////

         function isOk( index ) {
            return ng.isNumber( index ) && index >= 0;
         }
      },
      onShow() {
         if( !initialVisibilityPublished ) {
            const localName = $scope.model.panels[ $scope.model.selectedPanel ].areaName;
            const areaName = `${$scope.widget.id}.${localName}`;
            patterns.visibility.requestPublisherForArea( $scope, areaName )( true );
            initialVisibilityPublished = true;
         }
      }
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createPanelModel( area, index ) {

      const areaModel = {
         areaName: area.name,
         htmlLabel: localize( area.i18nHtmlLabel ),
         classes: {
            'ax-anonymize-me': area.anonymize,
            disabled: false,
            error: false,
            active: index === $scope.model.selectedPanel
         }
      };

      configureFlagHandler( area.validOn, valid => {
         areaModel.classes.error = !valid;
      } );
      configureFlagHandler( area.disabledOn, disabled => {
         areaModel.classes.disabled = disabled;
      } );
      configureFlagHandler( area.taggedOn, tagged => {
         areaModel.classes[ 'is-tagged' ] = tagged;
      } );

      if( area.selectionRequestTrigger && area.selectionRequestTrigger.onActions ) {
         area.selectionRequestTrigger.onActions.forEach( action => {
            $scope.eventBus.subscribe( `takeActionRequest.${action}`,
               createSelectionRequestTriggerHandler( area, index ) );
         } );
      }

      if( area.selectionRequest && area.selectionRequest.confirmationAction ) {
         $scope.eventBus.subscribe(
            `takeActionRequest.${area.selectionRequest.confirmationAction}`,
            handleDidConfirmSelection
         );
      }

      return areaModel;
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   // Make the given panel visible, make sure that contents are loaded (visible) first.
   function setSelectedPanel( newIndex ) {
      console.log( "setSelectedPanel", newIndex );
      const oldIndex = $scope.model.selectedPanel;

      if( !isNaN( oldIndex ) ) {
         $scope.model.panels[ oldIndex ].classes.active = false;
         publishFlagIfConfigured( oldIndex, false );
         publishVisibility( oldIndex, false );
      }

      if( !isNaN( newIndex ) ) {
         requestedPanel = newIndex;
         publishFlagIfConfigured( newIndex, true );
         publishVisibility( newIndex, true )
            .then( () => {
               implementSelection( newIndex );
            } );
      }

      const selectionAction = $scope.features.areas[ newIndex ].selection &&
                            $scope.features.areas[ newIndex ].selection.action;
      if( selectionAction ) {
         $scope.eventBus.publish( `takeActionRequest.${selectionAction}`, {
            action: selectionAction
         } );
      }

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishVisibility( index, visibility ) {
         if( !$scope.isVisible ) {
            return $q.when();
         }
         const areaName = [ $scope.widget.id, $scope.model.panels[ index ].areaName ].join( '.' );
         return patterns.visibility.requestPublisherForArea( $scope, areaName )( visibility );
      }

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      function implementSelection( index ) {
         $scope.model.panels[ index ].classes.active = true;
         $scope.model.selectedPanel = newIndex;
         allowNextPanelActivation = true;
      }

   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSelectionRequestTriggerHandler( areaFeatures, index ) {
      return function() {
         if( areaFeatures.selectionRequest && areaFeatures.selectionRequest.action ) {
            $scope.model.onBeforeActivate( index );
         }
         else {
            setSelectedPanel( index );
         }
      };
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function handleDidConfirmSelection() {
      if( requestedPanel < 0 ) {
         ax.log.debug( 'Received selection confirmation, but no panel selection was requested.' );
         return;
      }
      if( requestedPanel > $scope.model.panels.length - 1 ) {
         ax.log.warn( 'Received selection confirmation, but pending index [0] exceeds maximum of [1].',
                   requestedPanel,
                   $scope.model.panels.length - 1 );
         requestedPanel = -1;
         return;
      }

      setSelectedPanel( requestedPanel );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.model.onBeforeActivate = function( index ) {
      if( $scope.model.panels[ index ].classes.disabled ) {
         return false;
      }

      if( allowNextPanelActivation && index === requestedPanel ) {
         requestedPanel = -1;
         allowNextPanelActivation = false;
         // selection was already confirmed, allow UI to reflect it now:
         return true;
      }

      const areaConfig = $scope.features.areas[ index ];
      const selectionRequestAction = areaConfig.selectionRequest &&
                                   areaConfig.selectionRequest.action;
      if( selectionRequestAction ) {
         requestedPanel = index;
         $scope.eventBus.publish( `takeActionRequest.${selectionRequestAction}`, {
            action: selectionRequestAction
         } );
      }
      else {
         setSelectedPanel( index );
      }

      // wait for confirm and/or visibility propagation
      return false;
   };

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function configureFlagHandler( flag, handler ) {
      if( !flag ) {
         return;
      }
      const flagName = flag.replace( /^!/, '' );
      const isInverted = flagName !== flag;
      $scope.eventBus.subscribe( `didChangeFlag.${flagName}`, event => {
         handler( isInverted ? !event.state : event.state );
      } );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishFlagIfConfigured( areaIndex, state ) {
      const flag = $scope.features.areas[ areaIndex ].flag;
      if( flag ) {
         $scope.eventBus.publish( `didChangeFlag.${flag}.${state}`, {
            flag,
            state
         } );
      }
   }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'axAccordionWidget', [] )
   .controller( 'AxAccordionWidgetController', Controller ).name;
