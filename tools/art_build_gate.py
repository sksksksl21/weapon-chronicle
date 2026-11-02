"""Mandatory build gate for artwork managed by AI Dev Studio V2.

Legacy game content stays untouched. Once assets/v2-managed exists, the
ordinary game build MUST verify its manifest and every image against the
current, locally approved V2 Art Bible release. No bypass when V2 is offline.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys

MANAGED='assets/v2-managed'
SHA=re.compile(r'[0-9a-f]{64}\Z')
PACK=re.compile(r'pack_[0-9a-f]{24}\Z')
ASSET=re.compile(r'asset_[0-9a-f]{24}\Z')
SUPPORTED={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp'}


class ArtBuildBlocked(RuntimeError):
    """Explicitly blocked rather than shipping unverified artwork."""


def _manifest_asset_path(path):
    """Use forward slashes in manifest entries, independently of host OS."""
    return 'assets/'+path.name


def _safe_regular(path):
    return (path.is_file() and not path.is_symlink() and not
            (getattr(path.lstat(),'st_file_attributes',0) &
             getattr(stat,'FILE_ATTRIBUTE_REPARSE_POINT',0)))


def _safe_dir(path):
    return (path.is_dir() and not path.is_symlink() and not
            (getattr(path.lstat(),'st_file_attributes',0) &
             getattr(stat,'FILE_ATTRIBUTE_REPARSE_POINT',0)))


def verify(root, v2_root=None):
    """Return legacy/verified state, or stop the build before generating HTML."""
    root=Path(root).resolve()
    managed=root/MANAGED
    assets_root=root/'assets'
    if assets_root.is_symlink() or (assets_root.exists() and not _safe_dir(assets_root)):
        raise ArtBuildBlocked('게임 이미지 상위 경로가 안전하지 않습니다.')
    if managed.exists() and not managed.resolve().is_relative_to(root):
        raise ArtBuildBlocked('V2 관리 이미지 경로가 게임 루트 밖을 가리킵니다.')
    if not managed.exists() and not managed.is_symlink():
        return {'state':'legacy_unmodified','managed_assets':0}
    if not _safe_dir(managed):
        raise ArtBuildBlocked('V2 아트 관리 폴더가 안전하지 않습니다.')
    manifest=managed/'manifest.json'
    if not _safe_regular(manifest) or not 0<manifest.stat().st_size<=65536:
        raise ArtBuildBlocked('승인된 V2 아트 배포 목록이 없습니다.')
    try:
        data=json.loads(manifest.read_text(encoding='utf-8'))
    except (ValueError,UnicodeError) as exc:
        raise ArtBuildBlocked('아트 배포 목록 JSON이 손상됐습니다.') from exc
    if not isinstance(data,dict) or data.get('schema_version')!=1:
        raise ArtBuildBlocked('아트 배포 목록 버전이 유효하지 않습니다.')
    ids=data.get('requested_assets')
    assets=data.get('assets')
    project=data.get('project_id')
    pack=data.get('release_id')
    if (not isinstance(project,str) or not 1<=len(project)<=128 or
            not isinstance(pack,str) or not PACK.fullmatch(pack) or
            not isinstance(ids,list) or not isinstance(assets,list) or
            not 1<=len(ids)<=100 or len(ids)!=len(assets) or
            ids!=sorted(ids) or len(set(ids))!=len(ids) or
            any(not isinstance(x,str) or not ASSET.fullmatch(x) for x in ids)):
        raise ArtBuildBlocked('아트 에셋 ID 또는 배포 묶음 정보가 올바르지 않습니다.')
    if not SHA.fullmatch(str(data.get('style_sha256',''))) or type(data.get('style_version')) is not int:
        raise ArtBuildBlocked('승인된 아트 바이블 버전 정보가 없습니다.')
    directory=managed/'assets'
    if not _safe_dir(directory):
        raise ArtBuildBlocked('승인 이미지 저장 폴더가 없습니다.')
    observed=set()
    for aid,entry in zip(ids,assets):
        if not isinstance(entry,dict) or entry.get('asset_id')!=aid:
            raise ArtBuildBlocked('승인된 이미지 목록이 서로 다릅니다.')
        media=entry.get('media_type')
        digest=entry.get('sha256')
        filename='assets/'+aid+SUPPORTED.get(media,'')
        if (media not in SUPPORTED or not isinstance(digest,str) or
                not SHA.fullmatch(digest) or entry.get('filename')!=filename or
                type(entry.get('bytes')) is not int or
                not 1<=entry['bytes']<=3*1024*1024 or filename in observed):
            raise ArtBuildBlocked('허용되지 않은 이미지 메타데이터가 있습니다.')
        file=managed/filename
        if (not _safe_regular(file) or file.stat().st_size!=entry['bytes'] or
                hashlib.sha256(file.read_bytes()).hexdigest()!=digest):
            raise ArtBuildBlocked('미승인 또는 변조된 이미지로 게임 빌드를 중단했습니다.')
        observed.add(filename)
    if {_manifest_asset_path(p) for p in directory.iterdir()}!=observed:
        raise ArtBuildBlocked('승인 목록에 없는 그림이 섞여 있습니다.')
    if {p.name for p in managed.iterdir()}!={'assets','manifest.json'}:
        raise ArtBuildBlocked('V2 승인 폴더에 알 수 없는 파일이 포함됐습니다.')

    supplied=v2_root or os.environ.get('AI_DEV_STUDIO_V2_ROOT')
    if not supplied:
        # The V2 Windows import is always inside <V2 root>/workspaces/.
        # Discover only an ancestor that actually owns this checkout.
        for candidate in root.parents:
            if (root.is_relative_to(candidate/'workspaces') and
                    (candidate/'data'/'studio.sqlite3').is_file() and
                    (candidate/'app'/'art_release.py').is_file()):
                supplied=candidate
                break
    if not supplied:
        raise ArtBuildBlocked('V2 관리 이미지 빌드에는 등록된 Windows V2 작업 공간 또는 AI_DEV_STUDIO_V2_ROOT가 필요합니다.')
    home=Path(supplied).expanduser().resolve()
    db=home/'data'/'studio.sqlite3'
    if not db.is_file() or not (home/'app'/'art_release.py').is_file():
        raise ArtBuildBlocked('Windows V2 관리 서버 코드 또는 데이터베이스에 접근할 수 없습니다.')
    if str(home) not in sys.path:
        sys.path.insert(0,str(home))
    try:
        from app.art_release import ArtRelease
        result=ArtRelease(db).verify(project,pack)
        # V2 release evidence was re-verified against live locked Art Bible.
        if (result['state']!='verified' or result['assets']!=len(ids) or
                result['style_sha256']!=data['style_sha256'] or
                result['style_version']!=data['style_version']):
            raise ArtBuildBlocked('V2 현재 승인 기록과 게임 이미지가 일치하지 않습니다.')
        parent,_=ArtRelease(db)._paths(project)
        saved=json.loads((parent/pack/'manifest.json').read_text(encoding='utf-8'))
        # Require the copied manifest to match the V2-exported authoritative
        # manifest byte-for-byte semantically, including all asset hashes.
        if saved!=data:
            raise ArtBuildBlocked('현재 V2 배포 증거와 게임 이미지 목록이 다릅니다.')
    except ArtBuildBlocked:
        raise
    except (Exception,) as exc:
        raise ArtBuildBlocked('현재 V2 승인·무결성 검증이 실패하여 게임 빌드를 중단했습니다.') from exc
    return {'state':'approved_art_verified','managed_assets':len(ids),
            'style_version':data['style_version'],'release_id':pack}
