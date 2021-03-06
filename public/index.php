<!-- Check out the repo at https://github.com/mikaelgramont/drawmeakicker - Mika -->
<?php
	set_include_path(__DIR__.'/../php');
	require("constants.php");

	require('Zend/Loader.php');
	require('Zend/Cache.php');
	require('Zend/Exception.php');
	require("cache.php");
	require("dbsettings.php");
	require("kickerdao.php");
	require("opengraph.php");
	require("mobiledetector.php");
	require("share.php");
	require("versioning.php");
	
	$kickerData = null;
	$error = false;
	$message = "";
	$ogData = null;
	$initialValues = "''";
	$title = SITE_TITLE;
	$id = isset($_GET['id']) ? $_GET['id'] : null;
	$dev = isset($_GET['dev']) ? (bool)$_GET['dev'] : DEV;
	$isMobile = MobileDetector::isMobile($_SERVER['HTTP_USER_AGENT']);
	$vr = $isMobile || (isset($_GET['vr']) ? (bool)$_GET['vr'] : false);
	$useCdn = isset($_GET['cdn']) ? (bool)$_GET['cdn'] : USE_CDN;

	$cache = Cache::getCache(CACHE_METHOD);
	$files = array(
		'components/threejs/build/three.js',
		'components/webcomponentsjs/webcomponents.min.js',
		'fonts/archer_medium_regular.typeface.js',
		'imports.min.html',
		'imports.html',
		'scripts/main.js',
		'scripts/scripts.min.js',
		'styles/style.min.css',
		'models/board.dae',
		'images/textures/wood1_256.jpg',
		'images/textures/wood2_256.jpg',
		'images/textures/wood3_256.jpg'
	);
	$filePrefix = $useCdn ? CDN_PROTOCOL.'://'.CDN_URL.'/' : '/';
	if (BASE_URL) {
		$filePrefix .= BASE_URL.'/';
	}
	$versions = Versioning::getVersionList($files, $cache);
	$fullPaths = Versioning::getFullPaths($files, $versions, $filePrefix, $dev);

	$units = 'm';
	if (isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
		$isUS = (strpos($_SERVER['HTTP_ACCEPT_LANGUAGE'], 'en-US') === 0);
		$isCA = (strpos($_SERVER['HTTP_ACCEPT_LANGUAGE'], 'en-CA') === 0);
		if ($isUS || $isCA) {
			$units = 'ft';
		}
	}

	if ($id) {
		try {
			$kickerData = KickerDao::loadById($id, $cache);
		} catch(PDOException $e) {
			if (get_class($e) == 'PDOException') {
				$message = "We are having database issues. Sorry for the inconvenience.";
			}
			$error = true;
			error_log("Exception" . " - " . $e->getMessage());
		}
	}

	if (!$kickerData) {
		$kickerData = KickerDao::getDefaultData();
	}
	$ogData = OpenGraph::getKickerData($kickerData);
	$initialValues = json_encode($kickerData);
	if ($kickerData->title) {
		$title = htmlspecialchars($kickerData->title) . " - " . $title;
	}
	if ($error) {
		$initValues = KickerDao::getDefaultData();
	}
	$autoStart = json_encode($id && !$error);

	$body_classes = array();
	if ($vr) {
		$body_classes[] = "vr";
	}
	if ($autoStart && $id) {
		$body_classes[] = "loading-editor";
	}
	$body_classes = implode(" ", $body_classes);
?>
<html>
	<head>
		<meta charset="utf-8" />
		<title><?php echo $title?></title>
		<link rel="stylesheet" href="<?php echo $fullPaths['styles/style.min.css'] ?>">
		<meta http-equiv="Accept-CH" content="DPR, Viewport-Width, Width">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
		<?php
			if ($ogData) {
				echo OpenGraph::renderProperties($ogData);
			}
		?>
		<script src="<?php echo $fullPaths['components/webcomponentsjs/webcomponents.min.js'] ?>"></script>
	</head>

	<body class="<?php echo $body_classes ?>">
		<bihi-alert message="<?php echo $message ?>" id="alert"></bihi-alert>
		<div class="content">
			<header class="hidden-in-fullscreen">
		        <div role="banner" class="logo size-4">
		          <?php echo SITE_TITLE_HTML ?>
		        </div>
			</header>

			<div class="top-section-container hidden-in-fullscreen">
				<section class="top-section">
					<h2 class="top-section-header">
						<span>Ramp design</span>
						<span>the easy way.</span>
					</h2>
					<div class="top-section-body">
						<div class="intro-container top-section-content grid-element size-2">
							<p>If you're thinking of building a kicker and you have some idea of what you want, but are not sure about the exact dimensions, we can help.</p>
							<p>The nerds here have done the math for you, so you can focus on the fun part: deciding how big you want to go!</p>
							<button id="start-button" class="action">Get Started</button>
						</div>
						<div class="video-container top-section-content grid-element">
							<div class="video-aspect-ratio-wrapper">
								<?php if (VIDEO_ID) { ?>
								<iframe src="https://www.youtube.com/embed/<?php echo VIDEO_ID; ?>" frameborder="0" allowfullscreen></iframe>
								<?php } ?>
							</div>
						</div>
					</div>
				</section>
			</div>

			<div class="main" role="main">
				<div class="loading-placeholder">
					<svg class="load-animation rotating" version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="40px" height="40px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">
  						<path fill="#000" d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z" transform="rotate(291.879 25 25)"></path>
  					</svg>
				</div>
				<bihi-editor class="editor">
					<div id="renderer-mask"></div>
					<bihi-accordion class="renderer-accordion blueprint" role="tablist">
						<bihi-design-step caption="Design" step="0" display-step="1" active first>
							<bihi-controlbuttons id="buttons"></bihi-controlbuttons>							
							<bihi-design-fieldset legend="Parameters">
								<bihi-params id="params" units="<?php echo $units; ?>" <?php if ($id) echo "disabled"?>></bihi-params>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Results">
								<bihi-results id="results" units="<?php echo $units; ?>"></bihi-results>
							</bihi-design-fieldset>
						</bihi-design-step>

						<bihi-design-step caption="Visualize" step="1" display-step="2">
							<bihi-design-fieldset legend="Context">
								<bihi-context
									<?php if ($kickerData->annotations) echo "annotations" ?>
									<?php if ($kickerData->grid) echo "grid" ?> 
									<?php if ($kickerData->mountainboard) echo "mountainboard" ?> 
									<?php if ($kickerData->rider) echo "rider" ?>
								>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Image export">
								<bihi-export></bihi-export>
							</bihi-design-fieldset>
						</bihi-design-step>

						<bihi-design-step id="save-step" caption="Save" step="2" display-step="3"<?php if($id) { ?> class="hidden"<?php }?>>
							<bihi-design-fieldset legend="Information">
								<bihi-save></bihi-save>
							</bihi-design-fieldset>
						</bihi-design-step>

						<bihi-design-step id="share-step" caption="Share" step="3" display-step="3"<?php if(!$id) { ?> class="hidden"<?php }?>>
							<bihi-design-fieldset legend="Notes" class="share-notes">
								<p id="share-title"><?php echo htmlspecialchars($kickerData->title) ?></p>
								<p id="share-description"><?php echo htmlspecialchars($kickerData->description) ?></p>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Share with friends">
								<bihi-share twitter-label="Twitter" facebook-label="Facebook" twitter-url="<?php if ($ogData) echo Share::twitter($ogData["og:url"], $ogData["og:title"], $ogData["og:description"]); ?>" facebook-url="<?php if ($ogData) echo Share::facebook($ogData["og:url"]); ?>">
								</bihi-share>
							</bihi-design-fieldset>
						</bihi-design-step>

					</bihi-accordion>
					<div class="renderer-container">
						<div class="toolbar blueprint">
					      	<span id="mobile-menu" role="button" aria-label="menu" class="mobile-menu not-desktop toolbar-item">
								<svg height="31px" class="inverted" style="enable-background:new 0 0 32 32;" version="1.1" viewBox="0 0 32 32" width="31px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
									<path d="M4,10h24c1.104,0,2-0.896,2-2s-0.896-2-2-2H4C2.896,6,2,6.896,2,8S2.896,10,4,10z M28,14H4c-1.104,0-2,0.896-2,2  s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,14,28,14z M28,22H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2  S29.104,22,28,22z"/>
								</svg>					      		
					      	</span>
							<bihi-units class="toolbar-item first" units="<?php echo $units; ?>"></bihi-units>
							<bihi-representation class="toolbar-item"></bihi-representation>
						</div>
						<bihi-renderer3d id="renderer" class="blueprint"></bihi-renderer3d>
					</div>
				</bihi-editor>
			</div>
			<footer class="hidden-in-fullscreen">
				<ul>
					<li>
						<a href="<?php echo ABOUT_LINK ?>">About</a>
					</li>
					<li>
						<a href="<?php echo TWITTER_LINK ?>">Twitter</a>
					</li>
					<li>
						<a href="<?php echo GITHUB_LINK ?>">GitHub</a>
					</li>
				</ul>
			</footer>
		</div>
		<script>
			var BIHI = {
        initValues: <?php echo $initialValues ?>,
        autoStart: <?php echo $autoStart ?>,
        units: "<?php echo $units ?>",
        defaultTitle: "<?php echo SITE_TITLE ?>",
        defaultDescription: "<?php echo OG_DESCRIPTION ?>",
        three: "<?php echo $fullPaths['components/threejs/build/three.js'] ?>",
        files: [
          ['script', "<?php echo $fullPaths['fonts/archer_medium_regular.typeface.js'] ?>"],
<?php if ($dev) { ?>
          ['link', 'scripts/scripts.html'],
<?php } else { ?>
          ['script', "<?php echo $fullPaths['scripts/scripts.min.js'] ?>"],
<?php } ?>
<?php if ($dev) { ?>
          ['link', "<?php echo $fullPaths['imports.html'] ?>"]
<?php } else { ?>
          ['link', "<?php echo $fullPaths['imports.min.html'] ?>"]
<?php } ?>
        ],
        lazyLoadingFiles: {
    		'board': "<?php echo $fullPaths['models/board.dae'] ?>",
    		'wood1': "<?php echo $fullPaths['images/textures/wood1_256.jpg'] ?>",
    		'wood2': "<?php echo $fullPaths['images/textures/wood2_256.jpg'] ?>",
    		'wood3': "<?php echo $fullPaths['images/textures/wood3_256.jpg'] ?>"    		
        }
      };
		</script>
		<script src="<?php echo $fullPaths['scripts/main.js'] ?>"></script>
<?php if (ANALYTICS_ID) { ?>		
		<script>
		  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		  ga('create', '<?php echo ANALYTICS_ID ?>', 'auto');
		  ga('send', 'pageview');

		</script>		
<?php } ?>
	</body>
</html>
