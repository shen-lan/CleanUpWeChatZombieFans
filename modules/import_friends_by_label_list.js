/**
 * 导入标签
 */

(() => {
    let node_util;
    let db_util;
    let app_util;
    let log_util;
    /**
     * 控件id
     */
    let ids;
    /**
     * 控件文本
     */
    let texts;
    let language;
    let running_config;
    /**
     * 运行状态
     */
    let run;
    let stuck;
    let accumulator;
    let last_label;
    let last_friend_remark;
    let labels_map;

    /**
     * 点击通讯录
     */
    function clickContacts() {
        while (!idMatches(ids["labels"]).textMatches(texts["label"]).findOnce()) {
            if (node_util.backtrackClickNode(idMatches(ids["contacts"]).textMatches(texts["contacts"]).findOne(running_config["find_delay_duration"]))) {
                log_util.info("控件点击通讯录成功");
            } else {
                log_util.warn("控件点击通讯录失败");
                if (node_util.backtrackSimulationClickNode(idMatches(ids["contacts"]).textMatches(texts["contacts"]).findOne(running_config["find_delay_duration"]))) {
                    log_util.info("坐标点击通讯录成功");
                }
                log_util.error("坐标点击通讯录失败");
            }
        }
        return clickLabels;
    }

    /**
     * 通讯录页面点击标签
     */
    function clickLabels() {
        while (true) {
            if (node_util.backtrackClickNode(idMatches(ids["labels"]).textMatches(texts["label"]).findOne(running_config["find_delay_duration"]))) {
                log_util.info("控件点击通讯录标签成功");
                break;
            }
            log_util.warn("控件点击通讯录标签失败");
            sleep(running_config["click_delay_duration"]);
            if (node_util.backtrackSimulationClickNode(idMatches(ids["labels"]).textMatches(texts["label"]).findOne(running_config["find_delay_duration"]))) {
                log_util.info("坐标点击通讯录标签成功");
                break;
            }
            log_util.error("坐标点击通讯录标签失败");
        }
        return idMatches(ids["label_list"]).findOne(running_config["find_delay_duration"]) ? clickLabel : stopScript;
    }

    /**
     * 标签列表页面点击标签
     */
    function clickLabel() {
        while (true) {
            let label_nodes = idMatches(ids["label"]).untilFind();
            let count_nodes = idMatches(ids["contacts_count_by_label"]).untilFind();
            if (label_nodes.size() == count_nodes.size() && label_nodes.size() && count_nodes.size()) {
                // 标签列表滚动前后最后一个标签一致，标签列表已滚动到底部
                if (last_label == label_nodes.get(label_nodes.size() - 1).text()) {
                    return stopScript;
                }
                for (let i = 0; i < label_nodes.size(); i++) {
                    last_label = label_nodes.get(i).text();
                    if (count_nodes.get(i).text().match(/\d+/) > 0 && !labels_map[last_label]) {
                        if (node_util.backtrackClickNode(label_nodes.get(i)) || node_util.backtrackClickNode(count_nodes.get(i))) {
                            labels_map[last_label] = true;
                            last_friend_remark = null;
                            log_util.info("控件点击标签成功");
                            return synchronizeFriends;
                        }
                        log_util.warn("控件点击标签失败");
                        sleep(running_config["click_delay_duration"]);
                        if (node_util.backtrackSimulationClickNode(idMatches(ids["label"]).findOnce(i)) || node_util.backtrackSimulationClickNode(idMatches(ids["contacts_count_by_label"]).findOnce(i))) {
                            labels_map[last_label] = true;
                            last_friend_remark = null;
                            log_util.info("坐标点击标签成功");
                            return synchronizeFriends;
                        }
                        log_util.error("坐标点击标签失败");
                    }
                }
                return scrollLabelList;
            }
        }
    }

    /**
     * 导入好友标签备注
     */
    function synchronizeFriends() {
        let friend_remark_nodes = idMatches(ids["friend_remark_by_label"]).untilFind();
        // 好友列表滚动前后最后一个好友备注一致，好友列表已滚动到底部
        if (last_friend_remark == friend_remark_nodes.get(friend_remark_nodes.size() - 1).text()) {
            return backToLabelList;
        }
        for (let i = 0; i < friend_remark_nodes.size(); i++) {
            last_friend_remark = friend_remark_nodes.get(i).text();
            let label_friend = db_util.findLabelFriendByFriendRemark(last_friend_remark);
            let result = true;
            if (label_friend) {
                label_friend["label"] = last_label;
                result = db_util.modifyLabelFriend(label_friend);
            } else {
                label_friend = { label: last_label, friend_remark: last_friend_remark, enabled: false };
                result = db_util.addLabelFriend(label_friend);
            }
            if (!result) {
                log_util.error("导入好友标签失败");
            }
        }
        return scrollFriendList;
    }

    /**
     * 返回标签列表
     */
    function backToLabelList() {
        while (true) {
            if (node_util.backtrackClickNode(idMatches(ids["back_to_label_list"]).findOne(running_config["find_delay_duration"]))) {
                log_util.info("控件点击返回标签列表成功");
                break;
            }
            log_util.warn("控件点击返回标签列表失败");
            sleep(running_config["click_delay_duration"]);
            if (node_util.backtrackSimulationClickNode(idMatches(ids["back_to_label_list"]).findOne(running_config["find_delay_duration"]))) {
                log_util.info("坐标点击返回标签列表成功");
                break;
            }
            log_util.error("坐标点击返回标签列表失败");
        }
        last_label = null;
        log_util.info("----------------------------------------");
        return clickLabel;
    }

    /**
     * 滚动好友列表
     */
    function scrollFriendList() {
        while (true) {
            let node = idMatches(ids["friend_list_by_label"]).findOne(running_config["find_delay_duration"]);
            // 控件滚动好友列表
            if (node) {
                if (node.bounds().right > node.bounds().left) {
                    if (node_util.scrollForward(node)) {
                        log_util.info("控件滚动好友列表成功");
                        sleep(running_config["click_delay_duration"]);
                        break;
                    }
                    log_util.warn("控件滚动好友列表失败");
                } else {
                    log_util.warn("好友列表控件宽度为0");
                }
            } else {
                log_util.warn("好友列表控件id可能不一致");
            }
            // 坐标滚动好友列表
            setScreenMetrics(1080, 1920);
            if (swipe(540, 1658, 540, 428, running_config["click_delay_duration"])) {
                log_util.info("坐标滚动好友列表成功");
                break;
            }
            log_util.error("坐标滚动好友列表失败");
        }
        return synchronizeFriends;
    }

    /**
     * 滚动标签列表
     */
    function scrollLabelList() {
        while (true) {
            let node = idMatches(ids["label_list"]).findOne(running_config["find_delay_duration"]);
            // 控件滚动标签列表
            if (node) {
                if (node.bounds().right > node.bounds().left) {
                    if (node_util.scrollForward(node)) {
                        log_util.info("控件滚动标签列表成功");
                        sleep(running_config["click_delay_duration"]);
                        break;
                    }
                    log_util.warn("控件滚动标签列表失败");
                } else {
                    log_util.warn("标签列表控件宽度为0");
                }
            } else {
                log_util.warn("标签列表控件id可能不一致");
            }
            // 坐标滚动标签列表
            setScreenMetrics(1080, 1920);
            if (swipe(540, 1658, 540, 428, running_config["click_delay_duration"])) {
                log_util.info("坐标滚动标签列表成功");
                break;
            }
            log_util.error("坐标滚动标签列表失败");
        }
        log_util.info("----------------------------------------");
        return clickLabel;
    }

    /**
     * 监听音量下键按下，停止脚本运行
     */
    function keyDownListenerByVolumeDown() {
        threads.start(function () {
            // 启用按键监听
            events.observeKey();
            events.setKeyInterceptionEnabled("volume_down", true);
            // 监听减音量键按下
            events.onceKeyDown("volume_down", () => {
                stopScript();
            });
        });
    }

    /**
     * 累计器监听器
     */
    function accumulatorListener() {
        threads.start(function () {
            let localAccumulator = 0;
            setInterval(() => {
                if (localAccumulator == accumulator) {
                    stuck = true;
                    stopScript();
                }
                localAccumulator = accumulator;
            }, running_config["accumulator_delay_duration"]);
        });
    }

    /**
     * 停止脚本运行
     */
    function stopScript() {
        run = false;
        device.cancelKeepingAwake();
        events.removeAllListeners();
        threads.shutDownAll();
        toast(language["script_stopped"]);
        log_util.info(language["script_stopped"]);
        engines.myEngine().forceStop();
        if (stuck && running_config["reboot_script"]) {
            engines.execScriptFile(engines.myEngine().getSource().toString());
        } else {
            engines.execScriptFile("main.js");
        }
    }

    function main() {
        node_util = require("utils/node_util.js");
        db_util = require("utils/db_util.js");
        log_util = require("utils/log_util.js");
        app_util = require("utils/app_util.js");

        language = app_util.getLanguage();
        running_config = app_util.getRunningConfig();
        ids = app_util.getWeChatIds();
        texts = app_util.getWeChatTexts();

        run = true, accumulator = 0, labels_map = {};

        keyDownListenerByVolumeDown();
        accumulatorListener();
        device.keepScreenDim();

        toast(language["script_running"]);
        log_util.info(language["script_running"]);

        // 确保在微信首页
        let we_chat_package_name = app_util.getConfig()["we_chat_package_name"];
        launch(we_chat_package_name);
        while (!idMatches(ids["contacts"]).textMatches(texts["contacts"]).findOne(running_config["find_delay_duration"])) {
            back();
            if (currentPackage() == we_chat_package_name) {
                accumulator++;
            }
        }

        /**
         * 此方式流程控制较为灵活
         */
        for (let nextFunction = clickContacts(); run && nextFunction; nextFunction = nextFunction()) {
            accumulator++;
        }
    }

    main();
})();