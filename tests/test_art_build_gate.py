"""Focused mandatory-art build-gate tests; legacy game stays buildable."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from art_build_gate import verify, ArtBuildBlocked


class ArtBuildGateTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)/'game'
        self.root.mkdir()
        self.v2=Path(self.temp.name)/'V2'
        (self.v2/'data').mkdir(parents=True)
        (self.v2/'data'/'studio.sqlite3').touch()
        (self.v2/'app').mkdir()
        (self.v2/'app'/'art_release.py').touch()
        self.image=b'\x89PNG\r\n\x1a\nfictional-test-pixels'
        self.aid='asset_'+'a'*24
        self.release='pack_'+'b'*24
        self.digest=hashlib.sha256(self.image).hexdigest()
        self.style='c'*64
        self.payload={
            'schema_version':1,'project_id':'game','release_id':self.release,
            'style_version':1,'style_sha256':self.style,
            'requested_assets':[self.aid],
            'assets':[{'asset_id':self.aid,'filename':'assets/'+self.aid+'.png',
                       'sha256':self.digest,'media_type':'image/png',
                       'bytes':len(self.image),'name':'Knight','category':'enemy'}]
        }

    def tearDown(self):
        self.temp.cleanup()

    def managed(self):
        dest=self.root/'assets'/'v2-managed'/'assets'
        dest.mkdir(parents=True)
        (dest/(self.aid+'.png')).write_bytes(self.image)
        (dest.parent/'manifest.json').write_text(json.dumps(self.payload))
        evidence=self.v2/'evidence'/self.release
        evidence.mkdir(parents=True)
        (evidence/'manifest.json').write_text(json.dumps(self.payload))
        return dest,evidence

    def stub(self,evidence,result=None):
        value=result or {'state':'verified','assets':1,
                          'style_sha256':self.style,'style_version':1}
        parent=evidence.parent
        fake=types.ModuleType('app.art_release')
        class ArtRelease:
            def __init__(self,db):self.db=db
            def verify(self,project,pack):
                if project!='game' or pack!=self_release:
                    raise ValueError('unapproved')
                return value
            def _paths(self,project):return parent,None
        self_release=self.release
        fake.ArtRelease=ArtRelease
        app=types.ModuleType('app')
        app.__path__=[]
        return patch.dict(sys.modules,{'app':app,'app.art_release':fake})

    def test_old_game_without_managed_art_passes(self):
        self.assertEqual(verify(self.root)['state'],'legacy_unmodified')

    def test_empty_or_unapproved_managed_folder_blocks(self):
        (self.root/'assets'/'v2-managed').mkdir(parents=True)
        with self.assertRaisesRegex(ArtBuildBlocked,'목록'):
            verify(self.root,self.v2)

    def test_approved_pack_with_live_v2_evidence_passes(self):
        _,evidence=self.managed()
        with self.stub(evidence):
            result=verify(self.root,self.v2)
        self.assertEqual(result['state'],'approved_art_verified')
        self.assertEqual(result['managed_assets'],1)

    def test_missing_v2_approval_blocks_even_when_manifest_exists(self):
        self.managed()
        with patch.dict('os.environ',{'AI_DEV_STUDIO_V2_ROOT':''}):
            with self.assertRaisesRegex(ArtBuildBlocked,'AI_DEV_STUDIO_V2_ROOT'):
                verify(self.root)
        with self.assertRaises(ArtBuildBlocked):
            verify(self.root,Path(self.temp.name)/'no-such-v2')

    def test_tampered_image_blocks_before_using_v2(self):
        folder,_=self.managed()
        (folder/(self.aid+'.png')).write_bytes(b'bad')
        with self.assertRaisesRegex(ArtBuildBlocked,'변조'):
            verify(self.root,self.v2)

    def test_unlisted_file_blocks_before_using_v2(self):
        folder,_=self.managed()
        (folder/'sneaky.webp').write_bytes(b'something')
        with self.assertRaisesRegex(ArtBuildBlocked,'승인 목록'):
            verify(self.root,self.v2)

    def test_changed_art_bible_version_blocks_old_pack(self):
        _,evidence=self.managed()
        wrong={'state':'verified','assets':1,
               'style_sha256':self.style,'style_version':2}
        with self.stub(evidence,wrong):
            with self.assertRaisesRegex(ArtBuildBlocked,'현재 승인 기록'):
                verify(self.root,self.v2)

    def test_forged_manifest_cannot_relabel_different_content(self):
        _,evidence=self.managed()
        self.payload['style_sha256']='d'*64
        manifest=self.root/'assets'/'v2-managed'/'manifest.json'
        manifest.write_text(json.dumps(self.payload))
        with self.stub(evidence):
            with self.assertRaises(ArtBuildBlocked):
                verify(self.root,self.v2)


if __name__=='__main__':
    unittest.main()
