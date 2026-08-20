const { createRunOncePlugin, withProjectBuildGradle } = require('@expo/config-plugins');

function addSquareMavenRepository(contents) {
  if (contents.includes("https://sdk.squareup.com/public/android")) {
    return contents;
  }

  return contents.replace(
    /mavenCentral\(\)/,
    "mavenCentral()\n    maven { url 'https://sdk.squareup.com/public/android' }"
  );
}

function pinKotlinGradlePlugin(contents) {
  return contents.replace(
    /classpath\((['"])org\.jetbrains\.kotlin:kotlin-gradle-plugin\1\)/,
    "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.21')"
  );
}

function addOkHttpResolutionStrategy(contents) {
  if (contents.includes('Square In-App Payments can pull OkHttp 5.x')) {
    return contents;
  }

  return contents.replace(
    /(allprojects\s*\{\s*repositories\s*\{[\s\S]*?\n\s*\}\s*)\n\}/m,
    `$1

  // Square In-App Payments can pull OkHttp 5.x, while React Native still
  // expects OkHttp 4.x internals for its Android network stack.
  configurations.configureEach {
    resolutionStrategy {
      force 'com.squareup.okhttp3:okhttp:4.12.0'
      force 'com.squareup.okhttp3:okhttp-urlconnection:4.12.0'
      force 'com.squareup.okhttp3:logging-interceptor:4.12.0'
      force 'com.squareup.okio:okio:3.9.0'
    }
  }
}`
  );
}

function withSquareAndroidFixes(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    let contents = config.modResults.contents;
    contents = addSquareMavenRepository(contents);
    contents = pinKotlinGradlePlugin(contents);
    contents = addOkHttpResolutionStrategy(contents);
    config.modResults.contents = contents;
    return config;
  });
}

module.exports = createRunOncePlugin(withSquareAndroidFixes, 'with-square-android-fixes', '1.0.0');
