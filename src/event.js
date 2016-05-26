//import 'core-js/shim';

/**
 * Event based module, publish / subscribe with hierarchical events and notifications.
 *
 * Usage:
 *   Event.on('test_one_event', function() {
 *      console.log('test 1 event fired');
 *      console.log(arguments);
 *   });
 *
 *   Event.once('test_two_event', function() {
 *      console.log('test 2 event fired, once.');
 *      console.log(arguments);
 *   });
 *
 *   var three = Event.on('test_three_event', function() {
 *      console.log('test 3 event fired');
 *   });
 *
 *   Event.fire('test_one_event', {eventID: 1}); // fires ok
 *   Event.fire('test_two_event', {eventID: 2}); // fires ok
 *   Event.fire('test_two_event', {eventID: 3}); // didnt trigger the event since it was unsubscribed (subscribed once only)
 *   three.off(); // will remove the test_three_event
 *   Event.fire('test_three_event', {eventID: 4}); // didnt trigger, was remove line above.
 */
class Event {
    /**
     * Initates the object with an empty object to store the active subscriptions
     */
    constructor() {
        this._subscriptions = {};
    }


    /**
     * Attach a callback to an EventName
     *
     * @param {*} name - String/Array or event names to bind to
     * @param {Function} callback - Action that will be executed when even is fired.
     * @param {Object} context - The context to run the callback at.
     */
    on(name, callback, context) {
        context = context || this;

        // allows to subscribe multiple events for the same callback as single events. Clears the syntax on the other end.
        if (Array.isArray(name)) {
            for (let eventIdx = 0, len = name.length, eventName; eventIdx < len; eventIdx++) {
                eventName = name[eventIdx];
                this.on(eventName, callback, context);
            }

            // Quit after done.
            return true;
        }

        if ('undefined' === typeof this._subscriptions[name]) {
            this._subscriptions[name] = [];
        }

        this._subscriptions[name].push({
            callback: callback,
            context: context
        });

        // return back a clean remove function with the params encaspulated
        return ((eName, eCallback, eContext) => {
            return {
                off: () => {
                    return this.off(eName, eCallback, eContext);
                }
            };
        })(name, callback, context);
    }


    /**
     * Attach a callback to an name, but once only. Will disapear after first execution.
     *
     * @param {*} name - String/Array or event names to bind to
     * @param {Function} callback - Action that will be executed when even is fired.
     * @param {Object} context - The context to run the callback at.
     */
    once(name, callback, context) {
        var self = this,
            onceCallback = function() {
                self.off(name, onceCallback, context);
                callback.apply(this, arguments);
            };

        // preserve the original callback to allow subscribe once method to be removed later if needed.
        onceCallback._originalCallback = callback;

        this.on(name, onceCallback, context);
    }


    /**
     * Notify subscriptions by calling their name
     *
     * @param {string} name - of the even to fire
     * @param {Object} params - params to distribute to the callbacks
     */
    fire(name, params = {}) {
        let events = this._subscriptions[name] || [];

        for (let eventIdx = 0, len = events.length, event; eventIdx < len; eventIdx++) {
            event = events[eventIdx];
            event.callback.call(event.context, params);
        }
    }


    /**
     * Remove a specific name callback from the stack.
     *
     * Used mostly internally.. but not only. A diffrent ".off" is binded when you ".on" and a referance to this ".off"
     * is set.
     *
     * @param {string} name - String or event names to bind to
     * @param {Function} callback - Action that will be executed when even is fired.
     * @param {Object} context - The context to run the callback at.
     */
    off(name, callback, context) {
        context = context || this;

        let events = this._subscriptions[name],
            matchCallback = cb => {
                return cb === callback || cb._originalCallback === callback;
            };

        for (let eventIdx = events.length - 1; 0 <= eventIdx; eventIdx--) {
            let event = events[eventIdx];

            if (matchCallback(event.callback)) {
                events.splice(eventIdx, 1);
            }
        }

        // if no callbacks left remove the event name from the tree completly.
        if (0 === events.length) {
            delete this._subscriptions[name];
        }
    }


    /**
     * Removes all the subscriptions by reseting the queue.
     *
     * @returns {Object} this - an instance of the current running Event object.
     */
    removeAllSubscriptions() {
        this._subscriptions = [];

        return this;
    }


    /**
     * Get all the active subscriptions tree
     *
     * @returns {Array} of the active subscriptions
     */
    getAllSubscriptions() {
        return this._subscriptions;
    }


    /**
     * Detach events that the object subscribe to.
     *
     * @param events
     */
    detachEvents(events) {
        // Remove reference events.
        if (!events) {
            return;
        }

        events.forEach((event) => {
            event.off();
        });
    }
}

export default new Event();
