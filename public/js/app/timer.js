/*
 * @Author: Ethan Wu
 * @Date: 2021-06-27 18:41:05
 * @LastEditTime: 2021-06-27 18:48:25
 * @FilePath: /leanote/public/js/app/timer.js
 */

Timer = {};
Timer.interval = ""; // 定时器
Timer.intervalTime = 10 * 1000; // 10s
Timer.startInterval = function() {
	clearInterval(Note.interval);
	Timer.interval = setInterval(function() {
		log("自动保存开始...");
		// Note.curChangedSaveIt();
        Editor.saveNoteChange();
	}, Timer.intervalTime); // 600s, 10mins
};
// 停止, 当切换note时
// 但过5000后自动启动
Timer.stopInterval = function() {
	clearInterval(Timer.interval);
	setTimeout(function() {
		Timer.startInterval();
	}, Timer.intervalTime);
};