(ns metabase.logger.core-test
  (:require
   [clojure.java.io :as io]
   [clojure.string :as str]
   [clojure.test :refer :all]
   ^{:clj-kondo/ignore [:discouraged-namespace]}
   [clojure.tools.logging :as log]
   [clojure.tools.logging.impl :as log.impl]
   [metabase.logger.core :as logger]
   [metabase.test :as mt])
  (:import
   (org.apache.logging.log4j Level)
   (org.apache.logging.log4j.core Logger)))

(set! *warn-on-reflection* true)

(defn logger
  (^Logger []
   (logger 'metabase.logger.core-test))
  (^Logger [ns-symb]
   (log.impl/get-logger log/*logger-factory* ns-symb)))

(deftest added-appender-tests
  (testing "appender is added to the logger"
    (is (contains? (.getAppenders (logger)) "metabase-appender")
        "Logger does not contain `metabase-appender` logger"))
  (testing "logging adds to in-memory ringbuffer"
    (mt/with-log-level :debug
      (log/debug "testing in-memory logger")
      (is (some (fn [{message :msg, :as entry}]
                  (when (str/includes? (str message) "testing in-memory logger")
                    entry))
                (logger/messages))
          "In memory ring buffer did not receive log message")))

  (testing "set isAdditive = false if parent logger is root to prevent logging to console (#26468)"
    (testing "make sure it's true to starts with"
      (is (.isAdditive (logger 'metabase))))

    (testing "set to false if parent logger is root"
      (mt/with-log-level :warn
        (is (not (.isAdditive (logger 'metabase))))))

    (testing "still true if the parent logger is not root"
      (mt/with-log-level [metabase.logger.core :warn]
        (is (.isAdditive (logger 'metabase.logger.core)))))))

(deftest ^:parallel logger-test
  (testing "Using log4j2 logger"
    (is (= "org.apache.logging.log4j"
           (log.impl/name log/*logger-factory*))
        "Not using log4j2 logger factory. This could add two orders of magnitude of time to logging calls")))

(deftest logger-respect-configured-log-level-test
  (testing "The appender that we programmatically added should respect the log levels in the config file"
    ;; whether we're in the REPL or in test mode this should not show up
    (log/debug "THIS SHOULD NOT SHOW UP")
    (is (not (some (fn [{message :msg, :as entry}]
                     (when (str/includes? (str message) "THIS SHOULD NOT SHOW UP")
                       entry))
                   (logger/messages))))))

(deftest fork-logs-test
  (testing "logger/for-ns works properly"
    (mt/with-temp-file [filename]
      (let [f (io/file filename)]
        (with-open [_ (logger/for-ns f 'metabase.logger.core-test {:additive false})]
          (log/info "just a test"))
        (is (=? [#".*just a test.+"]
                (line-seq (io/reader f))))))))

(deftest fork-logs-test-2
  (testing "logger/for-ns works properly"
    (let [baos (java.io.ByteArrayOutputStream.)]
      (with-open [_ (logger/for-ns baos 'metabase.logger.core-test {:additive false})]
        (log/info "just a test"))
      (log/info "this line is not going into our stream")
      (testing "We catched the line we needed and did not catch the other one"
        (is (=? [#".*just a test.+"]
                (line-seq (io/reader (.toByteArray baos)))))))))

(deftest fork-logs-test-3
  (testing "We can capture few separate namespaces"
    (mt/with-temp-file [filename]
      (let [f (io/file filename)]
        (with-open [_ (logger/for-ns f ['metabase.logger.core-test
                                        'metabase.unknown]
                                     {:additive false})]
          (log/info "just a test")
          (log/log 'metabase.unknown :info nil "separate test")
          (testing "Check that `for-ns` will skip non-specified namespaces"
            (log/log 'metabase.unknown2 :info nil "this one going into standard log")))
        (is (=? [#".*just a test.+"
                 #".*separate test.+"]
                (line-seq (io/reader f))))))))

(deftest level-enabled?-test
  #_{:clj-kondo/ignore [:equals-true]}
  (are [set-level check-level expected-value] (= expected-value
                                                 (mt/with-log-level [metabase.logger.core-test set-level]
                                                   (logger/level-enabled? 'metabase.logger.core-test check-level)))
    :error Level/ERROR true
    :error Level/WARN  false
    :error Level/INFO  false
    :error Level/DEBUG false
    :error Level/TRACE false

    :warn Level/ERROR true
    :warn Level/WARN  true
    :warn Level/INFO  false
    :warn Level/DEBUG false
    :warn Level/TRACE false

    :info Level/ERROR true
    :info Level/WARN  true
    :info Level/INFO  true
    :info Level/DEBUG false
    :info Level/TRACE false

    :debug Level/ERROR true
    :debug Level/WARN  true
    :debug Level/INFO  true
    :debug Level/DEBUG true
    :debug Level/TRACE false

    :trace Level/ERROR true
    :trace Level/WARN  true
    :trace Level/INFO  true
    :trace Level/DEBUG true
    :trace Level/TRACE true))

(deftest memory-log-limits-messages
  (testing "The memory log buffer limits the number of messages and their length"
    (mt/with-log-level :debug
      (dotimes [_ 500]
        (log/debug (apply str (repeat 5000 "a"))))
      (log/debug (ex-info (apply str (repeat 600 "b")) {}) "exception message")
      (is (= 250 (count (logger/messages))))
      (is (= 4000 (reduce max 0 (map #(count (:msg %)) (logger/messages)))))
      (is (= 20 (reduce max 0 (map #(count (:exception %)) (logger/messages)))))
      (is (= 500 (reduce max 0 (map count (mapcat :exception (logger/messages)))))))))
