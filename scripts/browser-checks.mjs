import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { env, root } from './demo-environment.mjs';
import { logProblems } from './release-review.mjs';

// Read files without bootstrapping WordPress, so inspection adds no PHP notices.
function logs(selected, baseline = null) {
  const encoded = Buffer.from(JSON.stringify(baseline)).toString('base64');
  const php = `$base=json_decode(base64_decode('${encoded}'),true); $root=getcwd().'/wp-content/'; $files=array();
    if(is_file($root.'debug.log')) $files[]=$root.'debug.log';
    if(is_dir($root.'uploads/wc-logs')) foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'uploads/wc-logs',FilesystemIterator::SKIP_DOTS)) as $file) {
      if($file->isFile() && preg_match('/\\.(log|json)$/',$file->getFilename())) $files[]=$file->getPathname();
    }
    $result=array(); foreach($files as $file) { $name=substr($file,strlen($root)); $size=filesize($file); $inode=fileinode($file);
      if($base===null) { $result[$name]=array('size'=>$size,'inode'=>$inode); continue; }
      $old=$base[$name]??null; $start=$old && $old['inode']===$inode && $old['size']<=$size ? $old['size'] : 0;
      if($size>$start) $result[]=array('file'=>$name,'addedBytes'=>$size-$start,'truncated'=>$size-$start>524288,'text'=>file_get_contents($file,false,null,$start,min($size-$start,524288)));
    } echo json_encode($result);`;
  return JSON.parse(env(selected, ['run', 'cli', 'php', '-r', php], true));
}

export function runBrowserChecks(selected, args = [], requirePremium = selected.variant === 'subscriptions') {
  const baseline = logs(selected);
  const result = spawnSync(process.execPath, ['node_modules/playwright/cli.js', 'test', ...args], {
    cwd: root, stdio: 'inherit',
    env: { ...process.env, WP_BASE_URL: `http://localhost:${selected.port}`, DEMO_REPORT_PATH: selected.report,
      REQUIRE_PREMIUM_TESTS: requirePremium ? '1' : '', PLAYWRIGHT_SKIP_BROWSER_GC: '1' },
  });
  const changes = logs(selected, baseline);
  const problems = logProblems(changes);
  const report = { recordedAt: new Date().toISOString(), browserExit: result.status ?? 1, changes, problems };
  const filename = path.join(root, `.cache/browser-logs-${selected.variant}.json`);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(report, null, 2) + '\n');
  console.log(`Fresh WordPress/WooCommerce log problems: ${problems.length}. Report: ${filename}`);
  return { ...report, status: (result.status ?? 1) || (problems.length ? 1 : 0) };
}
