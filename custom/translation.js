var nav_translate = function (language) {
	if (language === 'ja') {
		return ja_translate();
	} else if (language === 'en') {
		return en_translate();
	};
};

function ja_translate () {
	var nav_bar = {
		dashboard 	: 'ダッシュボードの概要',
		trends 		: 'トレンド',
		enter_data	: 'データを入力します。',
	};

	return nav_bar;
};

function en_translate () {
	var nav_bar = {
		dashboard 	: 'Dashboard Overview',
		trends 		: 'Trends',
		enter_data	: 'Enter Data',
	};

	return nav_bar;
};

var translations = function (lan) {
	var data = {};
	if (lan === 'ja') {
		data.DASHBOARD_OVERVIEW 	= nav_translate('ja').dashboard,
		data.TRENDS 				= nav_translate('ja').trends,
		data.ENTER_DATA 			= nav_translate('ja').enter_data
	} else if (lan === 'en') {
		data.DASHBOARD_OVERVIEW 	= nav_translate('en').dashboard,
		data.TRENDS 				= nav_translate('en').trends,
		data.ENTER_DATA 			= nav_translate('en').enter_data
	};

	return data;
};