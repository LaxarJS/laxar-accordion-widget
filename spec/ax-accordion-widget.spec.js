/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../ax-accordion-widget',
   'laxar/laxar_testing'
], function( controller, ax ) {
   'use strict';

   describe( 'An AxAccordionWidget', function() {

      var testBed;

      describe( 'with configured areas', function() {

         beforeEach( function() {
            testBed = testBedAfterDidNavigate( function( testBed ) {
               testBed.featuresMock = {
                  areas: [
                     {
                        name:  'firstArea',
                        i18nHtmlLabel: { 'de_DE': 'Erster Bereich', 'en_US': 'First Area' },
                        flag: 'visible-firstArea',
                        anonymize: true,
                        taggedOn: 'dogtag'
                     },
                     {
                        name:  'secondArea',
                        i18nHtmlLabel: { 'de_DE': 'Zweiter Bereich', 'en_US': 'Second Area' },
                        flag: 'visible-secondArea',
                        validOn: 'secondResourceValid',
                        disabledOn: 'secondPanelDisabled'
                     },
                     {
                        name:  'thirdArea',
                        i18nHtmlLabel: { 'de_DE': 'Dritter Bereich', 'en_US': 'Third Area' },
                        anonymize: true
                     }
                  ]
               };
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'creates a widget area of all configured widget area names (R1.1)', function() {
            // no real test, but something must be done :)
            expect( testBed.scope.model.panels[ 0 ].areaName ).toEqual( 'firstArea' );
            expect( testBed.scope.model.panels[ 1 ].areaName ).toEqual( 'secondArea' );
            expect( testBed.scope.model.panels[ 2 ].areaName ).toEqual( 'thirdArea' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'renders localized html code (R1.2)', function() {
            expect( testBed.scope.model.panels[ 0 ].htmlLabel ).toEqual( 'First Area' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends the new flags on panel change if configured (R1.3)', function() {

            testBed.scope.eventBus.publish.reset();
            testBed.scope.model.onBeforeActivate( 1 );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visible-secondArea.true', {
                  flag: 'visible-secondArea',
                  state: true
               } );

            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visible-firstArea.false', {
                  flag: 'visible-firstArea',
                  state: false
               } );

            testBed.scope.eventBus.publish.reset();
            testBed.scope.model.onBeforeActivate( 2 );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.eventBus.publish ).not
               .toHaveBeenCalledWith( 'didChangeFlag.visible-thirdArea.true', {
                  flag: 'visible-thirdArea',
                  state: true
               } );

            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visible-secondArea.false', {
                  flag: 'visible-secondArea',
                  state: false
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends the current valid flag on beginLifecycleRequest (R1.4)', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visible-firstArea.true', {
                  flag: 'visible-firstArea',
                  state: true
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'makes the tab labels optionally anonymizable (R1.5)', function() {
            expect( testBed.scope.model.panels[ 0 ].classes[ 'ax-anonymize-me' ] ).toBeTruthy();
            expect( testBed.scope.model.panels[ 1 ].classes[ 'ax-anonymize-me' ] ).toBeFalsy();
            expect( testBed.scope.model.panels[ 2 ].classes[ 'ax-anonymize-me' ] ).toBeTruthy();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'shows the panel validity based on a configured flag (R1.6)', function() {
            expect( testBed.scope.model.panels[ 1 ].classes.error ).toBeFalsy();

            testBed.eventBusMock.publish( 'didChangeFlag.secondResourceValid.false', {
               flag: 'secondResourceValid',
               state: false
            } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.model.panels[ 1 ].classes.error ).toBeTruthy();

            testBed.eventBusMock.publish( 'didChangeFlag.secondResourceValid.true', {
               flag: 'secondResourceValid',
               state: true
            } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.model.panels[ 1 ].classes.error ).toBeFalsy();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'shows the panel disabled state based on a configured flag (R1.7)', function() {
            expect( testBed.scope.model.panels[ 1 ].classes.disabled ).toBeFalsy();

            testBed.eventBusMock.publish( 'didChangeFlag.secondPanelDisabled.true', {
               flag: 'secondPanelDisabled',
               state: true
            } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.model.panels[ 1 ].classes.disabled ).toBeTruthy();

            testBed.eventBusMock.publish( 'didChangeFlag.secondPanelDisabled.false', {
               flag: 'secondPanelDisabled',
               state: false
            } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.model.panels[ 1 ].classes.disabled ).toBeFalsy();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'prevents from selecting a disabled panel (R1.7)', function() {
            testBed.scope.model.onBeforeActivate( 1 );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.model.selectedPanel ).toEqual( 1 );

            testBed.eventBusMock.publish( 'didChangeFlag.secondPanelDisabled.true', {
               flag: 'secondPanelDisabled',
               state: true
            } );
            jasmine.Clock.tick( 0 );
            testBed.scope.model.onBeforeActivate( 1 );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.model.selectedPanel ).not.toEqual( 2 );

            testBed.eventBusMock.publish( 'didChangeFlag.secondPanelDisabled.false', {
               flag: 'secondPanelDisabled',
               state: false
            } );
            jasmine.Clock.tick( 0 );
            testBed.scope.model.onBeforeActivate( 2 );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.model.selectedPanel ).toEqual( 2 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets a is-tagged class based on a configured flag (R1.8)', function() {
            expect( testBed.scope.model.panels[ 0 ].classes[ 'is-tagged' ] ).toBeFalsy();

            testBed.eventBusMock.publish( 'didChangeFlag.dogtag.true', {
               flag: 'dogtag',
               state: true
            } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.model.panels[ 0 ].classes[ 'is-tagged' ] ).toBeTruthy();

            testBed.eventBusMock.publish( 'didChangeFlag.dogtag.false', {
               flag: 'dogtag',
               state: false
            } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.model.panels[ 0 ].classes[ 'is-tagged' ] ).toBeFalsy();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds to visibility requests for the provided areas (R1.9)', function() {
            // selected area:
            testBed.eventBusMock.publish(
               'changeAreaVisibilityRequest.testWidgetId.firstArea.true', {
                  area: 'testWidgetId.firstArea',
                  visible: true
               } );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.testWidgetId.firstArea.true', {
                  area: 'testWidgetId.firstArea',
                  visible: true
               }, jasmine.any( Object ) );

            // un-selected area:
            testBed.eventBusMock.publish(
               'changeAreaVisibilityRequest.testWidgetId.secondArea.true', {
                  area: 'testWidgetId.secondArea',
                  visible: true
               } );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.testWidgetId.secondArea.false', {
                  area: 'testWidgetId.secondArea',
                  visible: false
               }, jasmine.any( Object ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'issues change-visibility-requests for affected areas on selection change (R1.10)', function() {

            // 1. make the accordion itself visible
            testBed.eventBusMock.publish(
               'didChangeAreaVisibility.testArea.true', {
                  area: 'testArea',
                  visible: true
               } );
            jasmine.Clock.tick( 0 );

            // 2. select a different area
            testBed.scope.eventBus.publish.reset();
            testBed.scope.model.onBeforeActivate( 1 );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.eventBus.publishAndGatherReplies )
               .toHaveBeenCalledWith( 'changeAreaVisibilityRequest.testWidgetId.firstArea.false', {
                  area: 'testWidgetId.firstArea',
                  visible: false
               }, jasmine.any( Object ) );

            expect( testBed.scope.eventBus.publishAndGatherReplies )
               .toHaveBeenCalledWith( 'changeAreaVisibilityRequest.testWidgetId.secondArea.true', {
                  area: 'testWidgetId.secondArea',
                  visible: true
               }, jasmine.any( Object ) );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the selected tab is highlighted (R1.14)', function() {
            testBed.scope.model.onBeforeActivate( 0 );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.model.panels[ 0 ].classes.active ).toBe( true );
            expect( testBed.scope.model.panels[ 1 ].classes.active ).toBe( false );

            testBed.scope.model.onBeforeActivate( 1 );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.model.panels[ 0 ].classes.active ).toBe( false );
            expect( testBed.scope.model.panels[ 1 ].classes.active ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'suspends selections for a moment (to implement visibility) when no selection request action is defined (R2.2)', function() {
            testBed.scope.model.onBeforeActivate( 0 );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.model.onBeforeActivate( 1 ) ).toBe( false );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.model.onBeforeActivate( 1 ) ).toBe( true );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured selection action', function() {

         beforeEach( function() {
            testBed = testBedAfterDidNavigate( function( testBed ) {
               testBed.featuresMock = {
                  areas: [
                     {
                        name:  'firstArea',
                        i18nHtmlLabel: 'First Area'
                     },
                     {
                        name:  'secondArea',
                        i18nHtmlLabel: 'Second Area',
                        selection: {
                           action: 'selectionDone'
                        }
                     },
                     {
                        name:  'thirdArea',
                        i18nHtmlLabel: 'Second Area'
                     }
                  ]
               };
            } );

            // Simulate the initial activation triggered by the accordion directive
            testBed.scope.model.onBeforeActivate( 0 );
            jasmine.Clock.tick( 0 );
            testBed.scope.model.onBeforeActivate( 0 );

            testBed.scope.eventBus.publish.reset();
            testBed.scope.model.onBeforeActivate( 1 );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends the configured action after successful selection (R1.16)', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.selectionDone', {
                  action: 'selectionDone'
               } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured selection request action', function() {

         beforeEach( function() {
            testBed = testBedAfterDidNavigate( function( testBed ) {
               testBed.featuresMock = {
                  areas: [
                     {
                        name:  'firstArea',
                        i18nHtmlLabel: 'First Area'
                     },
                     {
                        name:  'secondArea',
                        i18nHtmlLabel: 'Second Area',
                        selectionRequest: {
                           action: 'selectionRequested'
                        }
                     },
                     {
                        name:  'thirdArea',
                        i18nHtmlLabel: 'Third Area',
                        selectionRequest: {
                           action: 'selectionRequested',
                           confirmationAction: 'selectionConfirmed'
                        }
                     }
                  ]
               };
            } );

            // Simulate the initial activation and subsequent watcher reaction by the accordion directive
            testBed.scope.model.onBeforeActivate( 0 );
            jasmine.Clock.tick( 0 );
            testBed.scope.model.onBeforeActivate( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'suspends selections instead of selecting it (R2.3)', function() {
            expect( testBed.scope.model.onBeforeActivate( 1 ) ).toBe( false );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the action configured for feature selectionRequest (R2.3)', function() {
            testBed.scope.model.onBeforeActivate( 1 );
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.selectionRequested', {
                  action: 'selectionRequested'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when a confirmation action is configured', function() {

            it( 'selects the panel when the confirmation action is received (R2.4)', function() {
               testBed.scope.model.onBeforeActivate( 2 );
               jasmine.Clock.tick( 0 );

               expect( testBed.scope.model.selectedPanel ).toEqual( 0 );

               testBed.eventBusMock.publish( 'takeActionRequest.selectionConfirmed', {
                  action: 'selectionConfirmed'
               } );
               jasmine.Clock.tick( 0 );

               expect( testBed.scope.model.selectedPanel ).toEqual( 2 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'ignores (but logs) confirmation without preceeding request (R2.5)', function() {
               spyOn( ax.log, 'develop' );

               testBed.eventBusMock.publish( 'takeActionRequest.selectionConfirmed', {
                     action: 'selectionConfirmed' }
               );
               jasmine.Clock.tick( 0 );

               expect( testBed.scope.model.selectedPanel ).toEqual( 0 );
               expect( ax.log.develop ).toHaveBeenCalled();
            } );


         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured selectionRequestTrigger action', function() {

         beforeEach( function() {
            testBed = testBedAfterDidNavigate( function( testBed ) {
               testBed.featuresMock = {
                  areas: [
                     {
                        name:  'firstArea',
                        i18nHtmlLabel: { 'de_DE': 'Erster Bereich', 'en_US': 'First Area' }
                     },
                     {
                        name:  'secondArea',
                        i18nHtmlLabel: { 'de_DE': 'Erster Bereich', 'en_US': 'First Area' },
                        selectionRequestTrigger: {
                           onActions: [
                              'pleasePleaseSelectSecondArea'
                           ]
                        }
                     },
                     {
                        name:  'thirdArea',
                        i18nHtmlLabel: { 'de_DE': 'Erster Bereich', 'en_US': 'First Area' },
                        selectionRequest: {
                           action: 'selectionRequested'
                        },
                        selectionRequestTrigger: {
                           onActions: [
                              'pleasePleaseSelectThirdArea'
                           ]
                        }
                     }
                  ]
               };
            } );

            // Simulate the initial activation triggered by the accordion directive
            testBed.scope.$apply( function() { testBed.scope.model.onBeforeActivate( 0 ); } );

            spyOn( testBed.scope.model, 'onBeforeActivate' ).andCallThrough();

            testBed.eventBusMock.publish( 'takeActionRequest.pleasePleaseSelectThirdArea',{
               action: 'pleasePleaseSelectThirdArea'
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'emits a selectionRequest action on receipt of a trigger action (R3.1)', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.selectionRequested', {
                  action: 'selectionRequested'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'but without selectionRequest action', function() {

            beforeEach( function() {
               testBed.eventBusMock.publish( 'takeActionRequest.pleasePleaseSelectSecondArea',{
                  action: 'pleasePleaseSelectSecondArea'
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'immediately selects the according area (R3.2)', function() {
               expect( testBed.scope.model.selectedPanel ).toEqual( 1 );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured i18n feature', function() {

         it( 'uses the configured locale (R4.1)', function() {
            testBed = testBedAfterDidNavigate( function( testBed ) {
               testBed.featuresMock = {
                  areas: [
                     {
                        name:  'firstArea',
                        i18nHtmlLabel: { 'de_DE': 'Erster Bereich', 'en_US': 'First Area' }
                     },
                     {
                        name:  'secondArea',
                        i18nHtmlLabel: { 'de_DE': 'Zweiter Bereich', 'en_US': 'Second Area' }
                     }
                  ],
                  i18n: {
                     locale: 'myLocale'
                  }
               };
            } );

            testBed.eventBusMock.publish( 'didChangeLocale.myLocale',
               { locale: 'myLocale', languageTag: 'en_US' }
            );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.i18n.locale ).toBe( 'myLocale' );
            expect( testBed.scope.i18n.tags.myLocale ).toBe( 'en_US' );

            testBed.eventBusMock.publish( 'didChangeLocale.myLocale',
               { locale: 'myLocale', languageTag: 'de_DE' }
            );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.i18n.locale ).toBe( 'myLocale' );
            expect( testBed.scope.i18n.tags.myLocale ).toBe( 'de_DE' );
         } );

      } );

   } );



   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function testBedAfterDidNavigate( testBedInitCallback, testBedSetupCallback ) {
      var testBed = ax.testing.portalMocksAngular.createControllerTestBed( 'laxarjs/ax-accordion-widget' );
      testBed.useWidgetJson();

      // populating these for simpler access in tests
      testBed.featuresMock = {};

      if( typeof testBedInitCallback === 'function' ) {
         testBedInitCallback( testBed );
      }

      testBed.setup();

      if( typeof testBedSetupCallback === 'function' ) {
         testBedSetupCallback( testBed );
      }

      testBed.eventBusMock.publish( 'didChangeLocale.default', {
         locale: 'default',
         languageTag: 'en_US'
      } );
      testBed.eventBusMock.publish( 'beginLifecycleRequest.default' );
      jasmine.Clock.tick( 0 );

      return testBed;
   }
} );
