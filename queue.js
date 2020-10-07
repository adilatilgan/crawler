// This a very basic Queue qith topic where you can subscribe and publish

class Queue {
  constructor() {
    this.subscribers = {}; //I will use pub sub to for this Queue
  }

  subscribe(topicName, callback) {
    if (!this.subscribers[topicName]) {
      this.subscribers[topicName] = [];
    }
    this.subscribers[topicName].push(callback);
  }

  publish(topicName, data) {
    if (!this.subscribers[topicName]) {
      return;
    }
    this.subscribers[topicName].forEach((callback) => {
      callback(data);
    });
  }

  unsub(topicName) {
    // Todo : implement unsubscribe from topic
  }
}

module.exports = Queue;
