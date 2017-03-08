/**
 * Copyright 2015-2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as axMocks from 'laxar-mocks';
import 'angular';
import 'angular-mocks';

describe( 'A laxar-accordion-widget', () => {

   let widgetEventBus;
   let widgetScope;
   let testEventBus;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSetup( widgetConfiguration ) {

      beforeEach( axMocks.setupForWidget() );

      beforeEach( () => {
         axMocks.widget.configure( widgetConfiguration );
      } );

      beforeEach( axMocks.widget.load );

      beforeEach( () => {
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with configured areas', () => {
      const configuration = {
         areas: [
            {
               name: 'firstArea',
               i18nHtmlLabel: { 'de': 'Erster Bereich', 'en': 'First Area' },
               flag: 'visible-firstArea',
               anonymize: true,
               taggedOn: 'dogtag'
            },
            {
               name: 'secondArea',
               i18nHtmlLabel: { 'de': 'Zweiter Bereich', 'en': 'Second Area' },
               flag: 'visible-secondArea',
               validOn: 'secondResourceValid',
               disabledOn: 'secondPanelDisabled'
            },
            {
               name: 'thirdArea',
               i18nHtmlLabel: { 'de': 'Dritter Bereich', 'en': 'Third Area' },
               anonymize: true
            }
         ]
      };
      createSetup( configuration );
      beforeEach( axMocks.triggerStartupEvents );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a widget area of all configured widget area names (R1.1)', () => {
         // no real test, but something must be done :)
         expect( widgetScope.model.panels[ 0 ].areaName ).toEqual( 'firstArea' );
         expect( widgetScope.model.panels[ 1 ].areaName ).toEqual( 'secondArea' );
         expect( widgetScope.model.panels[ 2 ].areaName ).toEqual( 'thirdArea' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'renders localized html code (R1.2)', () => {
         testEventBus.flush();
         expect( widgetScope.model.panels[ 0 ].htmlLabel ).toEqual( 'First Area' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends the new flags on panel change if configured (R1.3)', () => {

         widgetScope.model.onBeforeActivate( 1 );
         testEventBus.flush();

         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didChangeFlag.visible-secondArea.true', {
               flag: 'visible-secondArea',
               state: true
            } );

         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didChangeFlag.visible-firstArea.false', {
               flag: 'visible-firstArea',
               state: false
            } );

         widgetScope.model.onBeforeActivate( 2 );
         testEventBus.flush();

         expect( widgetEventBus.publish ).not
            .toHaveBeenCalledWith( 'didChangeFlag.visible-thirdArea.true', {
               flag: 'visible-thirdArea',
               state: true
            } );

         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didChangeFlag.visible-secondArea.false', {
               flag: 'visible-secondArea',
               state: false
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends the current valid flag on beginLifecycleRequest (R1.4)', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didChangeFlag.visible-firstArea.true', {
               flag: 'visible-firstArea',
               state: true
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'makes the tab labels optionally anonymizable (R1.5)', () => {
         expect( widgetScope.model.panels[ 0 ].classes[ 'ax-anonymize-me' ] ).toBeTruthy();
         expect( widgetScope.model.panels[ 1 ].classes[ 'ax-anonymize-me' ] ).toBeFalsy();
         expect( widgetScope.model.panels[ 2 ].classes[ 'ax-anonymize-me' ] ).toBeTruthy();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'shows the panel validity based on a configured flag (R1.6)', () => {
         expect( widgetScope.model.panels[ 1 ].classes.error ).toBeFalsy();

         testEventBus.publish( 'didChangeFlag.secondResourceValid.false', {
            flag: 'secondResourceValid',
            state: false
         } );
         testEventBus.flush();

         expect( widgetScope.model.panels[ 1 ].classes.error ).toBeTruthy();

         testEventBus.publish( 'didChangeFlag.secondResourceValid.true', {
            flag: 'secondResourceValid',
            state: true
         } );
         testEventBus.flush();

         expect( widgetScope.model.panels[ 1 ].classes.error ).toBeFalsy();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'shows the panel disabled state based on a configured flag (R1.7)', () => {
         expect( widgetScope.model.panels[ 1 ].classes.disabled ).toBeFalsy();

         testEventBus.publish( 'didChangeFlag.secondPanelDisabled.true', {
            flag: 'secondPanelDisabled',
            state: true
         } );
         testEventBus.flush();

         expect( widgetScope.model.panels[ 1 ].classes.disabled ).toBeTruthy();

         testEventBus.publish( 'didChangeFlag.secondPanelDisabled.false', {
            flag: 'secondPanelDisabled',
            state: false
         } );
         testEventBus.flush();

         expect( widgetScope.model.panels[ 1 ].classes.disabled ).toBeFalsy();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'prevents from selecting a disabled panel (R1.7)', done => {
         widgetScope.model.onBeforeActivate( 1 );
         flushVisibility().then( () => {
            expect( widgetScope.model.selectedPanel ).toEqual( 1 );

            testEventBus.publish( 'didChangeFlag.secondPanelDisabled.true', {
               flag: 'secondPanelDisabled',
               state: true
            } );
            testEventBus.flush();
            widgetScope.model.onBeforeActivate( 1 );

            flushVisibility().then( () => {
               expect( widgetScope.model.selectedPanel ).not.toEqual( 2 );

               testEventBus.publish( 'didChangeFlag.secondPanelDisabled.false', {
                  flag: 'secondPanelDisabled',
                  state: false
               } );
               testEventBus.flush();
               widgetScope.model.onBeforeActivate( 2 );
               flushVisibility().then( () => {
                  expect( widgetScope.model.selectedPanel ).toEqual( 2 );
                  done();
               } );
            } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sets a is-tagged class based on a configured flag (R1.8)', () => {
         expect( widgetScope.model.panels[ 0 ].classes[ 'is-tagged' ] ).toBeFalsy();

         testEventBus.publish( 'didChangeFlag.dogtag.true', {
            flag: 'dogtag',
            state: true
         } );
         testEventBus.flush();

         expect( widgetScope.model.panels[ 0 ].classes[ 'is-tagged' ] ).toBeTruthy();

         testEventBus.publish( 'didChangeFlag.dogtag.false', {
            flag: 'dogtag',
            state: false
         } );
         testEventBus.flush();

         expect( widgetScope.model.panels[ 0 ].classes[ 'is-tagged' ] ).toBeFalsy();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'responds to visibility requests for the provided areas (R1.9)', () => {
         expect( axMocks.widget.axVisibility.updateAreaVisibility ).toHaveBeenCalledWith( {
            firstArea: true,
            secondArea: false,
            thirdArea: false
         } );
         axMocks.widget.axVisibility.updateAreaVisibility.calls.reset();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'issues change-visibility-requests for affected areas on selection change (R1.10)', () => {
         axMocks.widget.axVisibility.updateAreaVisibility.calls.reset();
         widgetScope.model.onBeforeActivate( 1 );
         testEventBus.flush();
         expect( axMocks.widget.axVisibility.updateAreaVisibility ).toHaveBeenCalledWith( {
            firstArea: false,
            secondArea: true
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sets the active class of the initially opened panel', () => {
         expect( widgetScope.model.panels[ 0 ].classes.active ).toBe( true );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'the selected tab is highlighted (R1.14)', done => {
         widgetScope.model.onBeforeActivate( 0 );
         flushVisibility().then( () => {
            expect( widgetScope.model.panels[ 0 ].classes.active ).toBe( true );
            expect( widgetScope.model.panels[ 1 ].classes.active ).toBe( false );

            widgetScope.model.onBeforeActivate( 1 );
            flushVisibility().then( () => {
               expect( widgetScope.model.panels[ 0 ].classes.active ).toBe( false );
               expect( widgetScope.model.panels[ 1 ].classes.active ).toBe( true );
               done();
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'suspends selections for a moment (visibility) without selection request action (R2.2)', done => {
         widgetScope.model.onBeforeActivate( 0 );
         testEventBus.flush();
         expect( widgetScope.model.onBeforeActivate( 1 ) ).toBe( false );
         flushVisibility().then( () => {
            expect( widgetScope.model.onBeforeActivate( 1 ) ).toBe( true );
            done();
         } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured selection action', () => {
      const configuration = {
         areas: [
            {
               name: 'firstArea',
               i18nHtmlLabel: 'First Area'
            },
            {
               name: 'secondArea',
               i18nHtmlLabel: 'Second Area',
               selection: {
                  action: 'selectionDone'
               }
            },
            {
               name: 'thirdArea',
               i18nHtmlLabel: 'Second Area'
            }
         ]
      };
      createSetup( configuration );
      beforeEach( () => {
         axMocks.triggerStartupEvents();
      } );

      beforeEach( done => {
         // Simulate the initial activation triggered by the accordion directive
         widgetScope.model.onBeforeActivate( 0 );
         testEventBus.flush();
         widgetScope.model.onBeforeActivate( 0 );
         testEventBus.flush();
         widgetScope.model.onBeforeActivate( 1 );
         flushVisibility().then( () => {
            testEventBus.flush();
            done();
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends the configured action after successful selection (R1.16)', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'takeActionRequest.selectionDone', {
               action: 'selectionDone'
            } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with configured selection request action', () => {
      const configuration = {
         areas: [
            {
               name: 'firstArea',
               i18nHtmlLabel: 'First Area'
            },
            {
               name: 'secondArea',
               i18nHtmlLabel: 'Second Area',
               selectionRequest: {
                  action: 'selectionRequested'
               }
            },
            {
               name: 'thirdArea',
               i18nHtmlLabel: 'Third Area',
               selectionRequest: {
                  action: 'selectionRequested',
                  confirmationAction: 'selectionConfirmed'
               }
            }
         ]
      };
      createSetup( configuration );
      beforeEach( () => {
         axMocks.triggerStartupEvents();
      } );

      beforeEach( done => {
         // Simulate the initial activation and subsequent watcher reaction by the accordion directive
         widgetScope.model.onBeforeActivate( 0 );
         testEventBus.flush();
         flushVisibility().then( () => {
            widgetScope.model.onBeforeActivate( 0 );
            flushVisibility().then( done );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'suspends selections instead of selecting it (R2.3)', () => {
         expect( widgetScope.model.onBeforeActivate( 1 ) ).toBe( false );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'publishes the action configured for feature selectionRequest (R2.3)', () => {
         widgetScope.model.onBeforeActivate( 1 );
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'takeActionRequest.selectionRequested', {
               action: 'selectionRequested'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'selects the panel when the configured confirmation action is received (R2.4)', done => {
         widgetScope.model.onBeforeActivate( 2 );
         flushVisibility().then( () => {
            expect( widgetScope.model.selectedPanel ).toEqual( 0 );

            testEventBus.publish( 'takeActionRequest.selectionConfirmed', {
               action: 'selectionConfirmed'
            } );
            flushVisibility().then( () => {
               expect( widgetScope.model.selectedPanel ).toEqual( 2 );
               done();
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'ignores (but logs) confirmation without preceeding request (R2.5)', done => {
         expect( widgetEventBus.publish ).not.toHaveBeenCalled();
         testEventBus.publish( 'takeActionRequest.selectionConfirmed', {
            action: 'selectionConfirmed'
         } );
         flushVisibility().then( () => {
            expect( widgetScope.model.selectedPanel ).toEqual( 0 );
            expect( axMocks.widget.axLog.debug ).toHaveBeenCalled();
            done();
         } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured selectionRequestTrigger action', () => {
      const configuration = {
         areas: [
            {
               name: 'firstArea',
               i18nHtmlLabel: { 'de': 'Erster Bereich', 'en': 'First Area' }
            },
            {
               name: 'secondArea',
               i18nHtmlLabel: { 'de': 'Erster Bereich', 'en': 'First Area' },
               selectionRequestTrigger: {
                  onActions: [
                     'pleasePleaseSelectSecondArea'
                  ]
               }
            },
            {
               name: 'thirdArea',
               i18nHtmlLabel: { 'de': 'Erster Bereich', 'en': 'First Area' },
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
      createSetup( configuration );
      beforeEach( axMocks.triggerStartupEvents );

      beforeEach( () => {
         // Simulate the initial activation triggered by the accordion directive
         widgetScope.model.onBeforeActivate( 0 );

         testEventBus.publish( 'takeActionRequest.pleasePleaseSelectThirdArea', {
            action: 'pleasePleaseSelectThirdArea'
         } );
         testEventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'emits a selectionRequest action on receipt of a trigger action (R3.1)', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'takeActionRequest.selectionRequested', {
               action: 'selectionRequested'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'but without selectionRequest action', () => {

         beforeEach( done => {
            testEventBus.publish( 'takeActionRequest.pleasePleaseSelectSecondArea', {
               action: 'pleasePleaseSelectSecondArea'
            } );
            flushVisibility().then( done );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'immediately selects the corresponding area (R3.2)', () => {
            expect( widgetScope.model.selectedPanel ).toEqual( 1 );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with configured i18n feature', () => {
      createSetup( {
         areas: [
            {
               name: 'firstArea',
               i18nHtmlLabel: { 'de_DE': 'Erster Bereich', 'en_US': 'First Area' }
            },
            {
               name: 'secondArea',
               i18nHtmlLabel: { 'de_DE': 'Zweiter Bereich', 'en_US': 'Second Area' }
            }
         ],
         i18n: {
            locale: 'myLocale'
         }
      } );

      beforeEach( axMocks.triggerStartupEvents );

      it( 'uses the configured locale (R4.1)', () => {
         testEventBus.publish( 'didChangeLocale.myLocale',
            { locale: 'myLocale', languageTag: 'en_US' }
         );
         testEventBus.flush();
         expect( widgetScope.model.panels[ 0 ].htmlLabel ).toEqual( 'First Area' );

         testEventBus.publish( 'didChangeLocale.myLocale',
            { locale: 'myLocale', languageTag: 'de_DE' }
         );
         testEventBus.flush();
         expect( widgetScope.model.panels[ 0 ].htmlLabel ).toBe( 'Erster Bereich' );
      } );

   } );

   function flushVisibility() {
      testEventBus.flush();
      return Promise.resolve();
   }

} );
